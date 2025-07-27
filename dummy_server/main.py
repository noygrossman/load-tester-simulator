from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import json


# This class will handle incoming HTTP requests
# and generate responses to send back to the client.

class MyRequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        url_parts = urlparse(self.path)
        query_params = parse_qs(url_parts.query)

        response = {
            "body": json.dumps({
                "message": "Received your request!",
                "query_params": query_params
            }),
            "headers": {
                "Content-type": "application/json"
            },
            "status_code": 200
        }

        self.send_response(response["status_code"])
        for key, value in response["headers"].items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(response["body"].encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))

        request_data = self.rfile.read(content_length).decode('utf-8')

        expected_response = json.dumps({
            "message": "Received your request!",
            "request_data": request_data
        })

        response = {
            "status_code": 200,
            "headers": {
                "Content-type": "application/json"
            },
            "body": expected_response
        }

        response_json = json.dumps(response)
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(response_json.encode('utf-8'))


if __name__ == '__main__':
    # Create an HTTP server with the MyRequestHandler class as the handler.
    server = HTTPServer(('localhost', 8000), MyRequestHandler)

    print('Starting server, use <Ctrl-C> to stop')
    server.serve_forever()