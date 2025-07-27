
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from pymongo import MongoClient
from bson.json_util import dumps
import json
from bson import ObjectId
import socket
import struct








app = Flask(__name__)
CORS(app)


# connect to the MongoDB cluster
client = MongoClient("mongodb+srv://root:root@cluster0.eplednz.mongodb.net/test")
db = client.RequestDb
collection = db.RequestColl
collection2 = db.RtpColl
collection3 = db.DataColl
collection4 = db.DataColll

@app.route('/submit-form', methods=['POST'])
@app.route('/', methods=['GET'])
def submit_form():
    print(f"request.json: {request.json}")
    """
    - request: object containing the following properties:
        - url: string
        - method: string ('GET' or 'POST')
        - headers: object containing key-value pairs of request headers
        - data: object containing key-value pairs of form data
        - expectedResponse: (optional) expected response from the server
    Returns a JSON response containing a response object with the following properties:
    - status_code: integer representing the HTTP status code of the response
    - headers: object containing key-value pairs of response headers
    - body: string containing the response body
    """
    if request.method == 'POST':
        print("Request received:")
        print(f"Request method (request.method): {request.method}")
        print(f"Request URL (request.url): {request.url}")
        print(f"Request headers (request.headers): {request.headers}")
        print(f"Request data (request.data): {request.data}")

        # extract the url parameter from the request JSON object
        url = request.json.get('url')

        if not url:
            # return an error message if the url parameter is not provided
            return jsonify({'error': 'URL is required.'}), 400, {'Content-Type': 'application/json'}

        method = request.json.get('method', 'GET')

        data = request.json.get('data', {})
        expectedResponse = request.json.get('expectedResponse', None)

        # Validate method
        if method not in ('GET', 'POST'):
            return jsonify({'error': 'Method must be either GET or POST.'}), 400, {'Content-Type': 'application/json'}

        # Validate data
        if not isinstance(data, dict):
            return jsonify({'error': 'Data must be an object.'}), 400, {'Content-Type': 'application/json'}

        # Send the request to the specified URL using the specified method, headers, and data
        try:
            print("Sending request:")
            print(f"Request method (request.json.get(method)): {method}")
            print(f"Request URL (request.json.get(url)): {url}")
            print(f"Request data (request.json.get(data)): {data}")
            print(f"expectedResponse (request.json.get(expectedResponse)): {expectedResponse}")

            first_server_url = 'http://localhost:8000'

            try:
                response = requests.request(method, first_server_url, data=data)
            except requests.exceptions.RequestException as e:
                return jsonify({'error': f'Request failed: {str(e)}'}), 500, {'Content-Type': 'application/json'}

            print(f"response.headers: {response.headers}")
            print(f"response.text: {response.text}")

            json.loads(response.text)  # Ensure response is valid JSON
        except requests.exceptions.RequestException as e:
            return jsonify({'error': f'Request failed: {str(e)}'}), 500, {'Content-Type': 'application/json'}
        except json.JSONDecodeError as e:
            return jsonify({'error': f'Response body is not valid JSON: {str(e)}'}), 500, {
                'Content-Type': 'application/json'}

        # Save the request to the database
        try:
            request_doc = {
                'url': url,
                'method': method,
                # 'headers': headers,
                'data': data,
                'expectedResponse': expectedResponse,
                'response': {
                    'status_code': response.status_code,
                    # 'headers': dict(response.headers),
                    'body': response.text
                }
            }
            result = collection.insert_one(request_doc)
            print("Document inserted into MongoDB with ID:", result.inserted_id)
        except Exception as e:
            print("Error inserting document into MongoDB:", str(e))

        # Parse the response and return it
        try:
            response_body = response.text
            response_headers = dict(response.headers)
            response_status_code = response.status_code

            response_data = {
                'status_code': response_status_code,
                'headers': response_headers,
                'body': response_body
            }
            print(f" response_data: {response_data}")
            if 'application/json' not in response.headers.get('Content-Type'):
                return jsonify({'error': 'Response is not JSON.'}), 500, {'Content-Type': 'application/json'}

            print(f" ......check.....")
            print(f" expectedResponse: {expectedResponse}")
            print(f" response_body: {response_body}")

            # Check expected response
            if expectedResponse is not None and expectedResponse != response_body:
                response_data['error'] = f'Unexpected response: {response_body}'

            return jsonify({
                'body': response_body,
                'headers': response_headers,
                'status_code': response_status_code
            }), 200, {'Content-Type': 'application/json'}
        except Exception as e:
            return jsonify({'error': f'Response parsing failed: {str(e)}'}), 500, {'Content-Type': 'application/json'}


@app.route('/requests', methods=['GET', 'POST'])
def request_handler():
    if request.method == 'GET':
        documents = collection.find()
        # Convert ObjectId to string and parse JSON into a dictionary
        data = [json.loads(dumps(doc, default=str)) for doc in documents]
        return jsonify(data)

@app.route('/resource/<resource_id>', methods=['DELETE'])
def delete_resource(resource_id: str):
    # use the string representation to create an ObjectId object
    oid = ObjectId(resource_id)

    # use the ObjectId object to query the database
    result = collection.delete_one({"_id": oid})
    if result.deleted_count == 1:
        print(f"Resource with ID {resource_id} deleted successfully.")
        return jsonify({'success': True})
    else:
        print(f"No resource found with ID {resource_id}.")
        return jsonify({'success': False})

@app.route('/rtp', methods=['POST'])
def submit_rtp_form():
    if request.method == 'POST':
        print("RTP Request received:")
        print(f"Request source IP (request.json.get('sourceIP')): {request.json.get('sourceIP')}")
        print(f"Request source port (request.json.get('sourcePort')): {request.json.get('sourcePort')}")
        print(f"Request destination IP (request.json.get('destinationIP')): {request.json.get('destinationIP')}")
        print(f"Request destination port (request.json.get('destinationPort')): {request.json.get('destinationPort')}")
        print(f"Request payload type (request.json.get('payloadType')): {request.json.get('payloadType')}")

        destination_ip = request.json.get('destinationIP')
        destination_port = request.json.get('destinationPort')

        audio_file_path = 'D:/Users/galno/Downloads/workk.wav'

        with open(audio_file_path, 'rb') as file:

            rtp_destination_ip = destination_ip
            rtp_destination_port = destination_port

            # Create a UDP socket for RTP
            rtp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

            # RTP communication loop
            iterations = 0

            print("Destination IP:", rtp_destination_ip)
            print("Destination Port:", rtp_destination_port)

            while True:
                # Read audio data from the file
                audio_data = file.read(1024)
                if not audio_data:
                    # No more data to read, break the loop
                    break

                # Prepare RTP packet pack values into a binary
                # string according to the given format.
                rtp_packet = struct.pack("!HH", 10, iterations) + audio_data


                try:
                    print("Sending RTP packet")
                    # Send RTP packet to the destination
                    rtp_socket.sendto(rtp_packet, (rtp_destination_ip, rtp_destination_port))
                    print("RTP packet sent:", iterations)
                except socket.error as e:
                    # Handle RTP communication error
                    response = {
                        'status_code': 500,
                        'body': "RTP communication failed: " + str(e)
                    }
                    print("Error sending RTP packet:", str(e))
                    break

                # Increment the iterations count
                iterations += 1

            # Close the RTP socket
            rtp_socket.close()

            # RTP communication successful
            response = {
                'status_code': 200,
                'body': 'RTP communication successful.'
            }

        # Save the request to the database
        try:
            request_doc = {
                'sourceIP': request.json.get('sourceIP'),
                'sourcePort': request.json.get('sourcePort'),
                'destinationIP': request.json.get('destinationIP'),
                'destinationPort': request.json.get('destinationPort'),
                'payloadType': request.json.get('payloadType'),
                'response': response
            }
            result = collection2.insert_one(request_doc)
            print("RTP Document inserted into MongoDB with ID:", result.inserted_id)
        except Exception as e:
            print("Error inserting RTP document into MongoDB:", str(e))

        # Return the RTP response as JSON with appropriate headers
        return jsonify({
            'body': response,
            'status_code': response
        }), 200, {'Content-Type': 'application/json'}

@app.route('/requests2', methods=['GET', 'POST'])
def request_handler2():
    if request.method == 'GET':
        documents = collection2.find()
        # Convert ObjectId to string and parse JSON into a dictionary
        data = [json.loads(dumps(doc, default=str)) for doc in documents]
        return jsonify(data)

@app.route('/resource1/<resource_id>', methods=['DELETE'])
def delete_resource2(resource_id: str):
    # use the string representation to create an ObjectId object
    oid = ObjectId(resource_id)

    # use the ObjectId object to query the database
    result = collection2.delete_one({"_id": oid})
    if result.deleted_count == 1:
        print(f"Resource with ID {resource_id} deleted successfully.")
        return jsonify({'success': True})
    else:
        print(f"No resource found with ID {resource_id}.")
        return jsonify({'success': False})

# status code and time insert handler
@app.route('/save-response', methods=['POST'])
def save_response():
    data = request.get_json()
    totalResponseTime = data['totalResponseTime']
    status_code = data['status_code']
    data1 = data['data']
    startTime = data['startTime']
    repeat = data['repeat']

    response_data = {
        'totalResponseTime': totalResponseTime,
        'status_code': status_code,
        'data': data1,
       'startTime': startTime,
       'repeat': repeat,
    }

    # Save the response data to the collection
    collection3.insert_one(response_data)

    return jsonify({'message': 'Response saved successfully'})

@app.route('/requests3', methods=['GET', 'POST'])
def request_handler3():
    if request.method == 'GET':
        documents = collection3.find()
        # Convert ObjectId to string and parse JSON into a dictionary
        data = [json.loads(dumps(doc, default=str)) for doc in documents]
        return jsonify(data)


@app.route('/resource4/<resource_id>', methods=['DELETE'])
def delete_resource3(resource_id: str):
    # use the string representation to create an ObjectId object
    oid = ObjectId(resource_id)

    # use the ObjectId object to query the database
    result = collection3.delete_one({"_id": oid})
    if result.deleted_count == 1:
        print(f"Resource with ID {resource_id} deleted successfully.")
        return jsonify({'success': True})
    else:
        print(f"No resource found with ID {resource_id}.")
        return jsonify({'success': False})

@app.route('/save-response2', methods=['POST'])
def save_response2():
    data = request.get_json()
    totalResponseTime = data['totalResponseTime']
    status_code = data['status_code']
    data1 = data['data']
    startTime = data['startTime']
    repeat = data['repeat']

    response_data = {
        'totalResponseTime': totalResponseTime,
        'status_code': status_code,
         'data': data1,
       'startTime': startTime,
        'repeat': repeat,
    }

    # Save the response data to the collection
    collection4.insert_one(response_data)

    return jsonify({'message': 'Response saved successfully'})

@app.route('/requests4', methods=['GET', 'POST'])
def request_handler4():
    if request.method == 'GET':
        documents = collection4.find()
        # Convert ObjectId to string and parse JSON into a dictionary
        data = [json.loads(dumps(doc, default=str)) for doc in documents]
        return jsonify(data)

@app.route('/resource5/<resource_id>', methods=['DELETE'])
def delete_resource4(resource_id: str):
    # use the string representation to create an ObjectId object
    oid = ObjectId(resource_id)

    # use the ObjectId object to query the database
    result = collection4.delete_one({"_id": oid})
    if result.deleted_count == 1:
        print(f"Resource with ID {resource_id} deleted successfully.")
        return jsonify({'success': True})
    else:
        print(f"No resource found with ID {resource_id}.")
        return jsonify({'success': False})

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)











