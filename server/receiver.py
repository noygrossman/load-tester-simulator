import socket
import pyaudio
import struct
import signal

receiver_ip = '127.0.0.1'
receiver_port = 3001
receiver_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
receiver_socket.bind((receiver_ip, receiver_port))

audio = pyaudio.PyAudio()
stream = audio.open(format=pyaudio.paInt16, channels=2, rate=44100, output=True)

interrupted = False

def signal_handler(signal, frame):
    global interrupted
    interrupted = True

signal.signal(signal.SIGINT, signal_handler)

while not interrupted:
    try:
        rtp_packet, sender_address = receiver_socket.recvfrom(4096)
        payload_type, sequence_number = struct.unpack('!HH', rtp_packet[:4])
        audio_data = rtp_packet[4:]

        stream.write(audio_data)
        print("Playing audio data...")
    except socket.error as e:
        print("Socket error:", e)
        break

stream.stop_stream()
stream.close()
audio.terminate()
receiver_socket.close()