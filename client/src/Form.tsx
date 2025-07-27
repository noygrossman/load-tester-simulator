import React, { useState, useEffect } from 'react';
import axios, { Method } from 'axios';
import './App.css';
import logo from './pictures/Bamza_108.png';



type FormData = {
    url: string;
    method: string;
    numData: number;
    data: Record<string, string>;
    repeat: number;
    expectedResponse: string;
};

type RtpData = {
    sourceIP: string;
    sourcePort: number;
    destinationIP: string;
    destinationPort: number;
    payloadType: string;
};

const HttpForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        url: '',
        method: 'POST',
        numData: 0,
        data: {},
        repeat: 1,
        expectedResponse: '',
    });

    const [responseData, setResponseData] = useState<any[]>([]);

    const [responseData2, setResponseData2] = useState<any[]>([]);


    const [responseStatusCodes, setResponseStatusCodes] = useState<number[]>([]);
    const [totalResponseTime, setTotalResponseTime] = useState<number>(0);

    const formatSentTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString(); 
    };

    useEffect(() => {
        axios.get('http://localhost:5000/requests').then((response) => {
            setResponseData(response.data);
            console.log('Response data:', response.data);

        });
    }, []);

    useEffect(() => {
        axios.get('http://localhost:5000/requests3').then((response) => {
            setResponseData2(response.data);
            console.log('Response data:', response.data);
        });
    }, []);



    const handleDelete = (index: number) => {
        const newResponseData = [...responseData];

        // Send a DELETE request to the server to delete the item from the database
        const itemIdToDelete = newResponseData[index]._id.$oid;
        console.log('itemIdToDelete:', itemIdToDelete);
        axios.delete(`http://localhost:5000/resource/${itemIdToDelete}`)
            .then(response => {
                newResponseData.splice(index, 1);
                setResponseData(newResponseData);
            })
            .catch(error => {
                console.error(error);
            });
    };

    const handleDeleteTime = (index: number) => {
        const newResponseData = [...responseData2];

        // Send a DELETE request to the server to delete the item from the database
        const itemIdToDelete = newResponseData[index]._id.$oid;
        console.log('itemIdToDelete:', itemIdToDelete);
        axios.delete(`http://localhost:5000/resource4/${itemIdToDelete}`)
            .then(response => {
                newResponseData.splice(index, 1);
                setResponseData2(newResponseData);
            })
            .catch(error => {
                console.error(error);
            });
    };

    const handleSendRequest = async (request: any) => {
        const { url, method, data, expectedResponse } = request;
        console.log('data:', data);
        let repeat = 1;

        const keypairs: Record<string, string> = {};

        for (let i = 0; i < numData; i++) {
            const key = formData.data[`key_${i}`];
            const value = formData.data[`value_${i}`];
            if (key && value) {
                keypairs[key] = value;
            }
        }

        console.log('data:', data);
        const requestData = { data, url, method, expectedResponse };
        console.log('requestData:', requestData);

        // Send the data to the server using AJAX
        console.log('HTTP method:', method);
        const startTime = new Date().getTime();
        const response = await axios({
            method,
            url,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(requestData),
            responseType: 'json'
        });

        const endTime = new Date().getTime();
        const responseTime = endTime - startTime;

        if (response.status !== 200) {
            console.error(`Unexpected response status code: ${response.status}`);
            return;
        }

        console.log('response data:', JSON.stringify(response.data))

        if (expectedResponse) {
            const expected = JSON.parse(expectedResponse);
            const actual = response.data;

            console.log('expected:', expected);
            console.log('actual:', actual);

            if (expected.status_code !== actual.status_code) {
                console.error(`Unexpected status code. Expected: ${expected.status_code}, Actual: ${actual.status_code}`);
            }

            const expectedHeaders = expected.headers;
            const actualHeaders = actual.headers;
            const headerKeys = Object.keys(expectedHeaders);

            for (const key of headerKeys) {
                if (expectedHeaders[key] !== actualHeaders[key]) {
                    console.error(`Unexpected header value for "${key}". Expected: ${expectedHeaders[key]}, Actual: ${actualHeaders[key]}`);
                }
            }

            const expectedBody = expected.body;
            const actualBody = JSON.parse(actual.body);

            if (expectedBody.message !== actualBody.message || expectedBody.request_data !== actualBody.request_data) {
                console.error(`Unexpected body. Expected: ${JSON.stringify(expectedBody)}, Actual: ${JSON.stringify(actualBody)}`);
            }

        }

        console.log('Request sent successfully!');
        setResponseStatusCodes([response.status]);
        const totalResponseTime = responseTime;
        setTotalResponseTime(totalResponseTime);

        const responseServerData = {
            totalResponseTime: totalResponseTime,
            status_code: response.status,
            data: JSON.stringify(requestData),
            startTime: startTime,
            repeat

        };

        try {
            const responseServerResponse = await axios.post('http://localhost:5000/save-response', responseServerData);
            console.log('Response sent to the response server:', responseServerResponse.data);
        } catch (error) {
            console.error('Failed to send response to the response server:', error);
        }

    };



    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDataInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            data: { ...formData.data, [name]: value },
        });
    };

    const handleEdit = (index: number) => {
        const requestData = responseData[index];

        setFormData({
            url: requestData.url,
            method: requestData.method,
            numData: requestData.data ? Object.keys(requestData.data).length - 1 : 0,
            data: requestData.data || {},
            repeat: requestData.repeat || 1,
            expectedResponse: requestData.expectedResponse || '',
        });

        const form = document.querySelector("form");
        if (form) {
            const { url, method, numData, data, repeat, expectedResponse } = formData;
            (form.elements.namedItem("url") as HTMLInputElement).value = url;
            (form.elements.namedItem("method") as HTMLSelectElement).value = method;
            (form.elements.namedItem("numData") as HTMLInputElement).value = String(numData);
            for (let i = 0; i < numData; i++) {
                (form.elements.namedItem(`key_${i}`) as HTMLInputElement).value = data[`key_${i}`] || "";
                (form.elements.namedItem(`value_${i}`) as HTMLInputElement).value = data[`value_${i}`] || "";
            }
            (form.elements.namedItem("repeat") as HTMLInputElement).value = String(repeat);
            (form.elements.namedItem("expectedResponse") as HTMLInputElement).value = expectedResponse;
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const { url, method, data, numData, repeat, expectedResponse } = formData;

            if (!url) {
                console.error('URL is required');
                return;
            }

            const keypairs: Record<string, string> = {};

            for (let i = 0; i < numData; i++) {
                const key = formData.data[`key_${i}`];
                const value = formData.data[`value_${i}`];
                if (key && value) {
                    keypairs[key] = value;
                }
            }

            console.log('data:', data);
            const requestData = { data, url, method, expectedResponse };
            console.log('requestData:', requestData);

            const requestResponseTimes = [];
            let response: any;
            let startTime;

            for (let i = 0; i < repeat; i++) {
                console.log('HTTP method:', method);
                startTime = new Date().getTime();

                response = await axios({
                    method,
                    url,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: JSON.stringify(requestData),
                    responseType: 'json'
                });
                const endTime = new Date().getTime();
                const responseTime = endTime - startTime;

                if (response.status !== 200) {
                    console.error(`Unexpected response status code: ${response.status}`);
                }

                console.log(JSON.stringify(response.data));

                if (expectedResponse) {
                    const expected = JSON.parse(expectedResponse);
                    const actual = response.data;

                    console.log('expected:', expected);
                    console.log('actual:', actual);

                    if (expected.status_code !== actual.status_code) {
                        console.error(`Unexpected status code. Expected: ${expected.status_code}, Actual: ${actual.status_code}`);
                    }

                    const expectedHeaders = expected.headers;
                    const actualHeaders = actual.headers;
                    const headerKeys = Object.keys(expectedHeaders);

                    for (const key of headerKeys) {
                        if (expectedHeaders[key] !== actualHeaders[key]) {
                            console.error(`Unexpected header value for "${key}". Expected: ${expectedHeaders[key]}, Actual: ${actualHeaders[key]}`);
                        }
                    }

                    const expectedBody = expected.body;
                    const actualBody = JSON.parse(actual.body);

                    if (expectedBody.message !== actualBody.message || expectedBody.request_data !== actualBody.request_data) {
                        console.error(`Unexpected body. Expected: ${JSON.stringify(expectedBody)}, Actual: ${JSON.stringify(actualBody)}`);
                    }

                }
                requestResponseTimes.push(responseTime);
                setResponseStatusCodes((prevStatusCodes) => [...prevStatusCodes, response.status]);
            }

            setFormData({
                url: '',
                method: 'POST',
                numData: 0,
                data: {},
                repeat: 1,
                expectedResponse: '',
            });

            const totalResponseTime = requestResponseTimes.reduce((sum, time) => sum + time, 0);
            setTotalResponseTime(totalResponseTime);

            const additionalRequestData = {
                totalResponseTime,
                status_code: response.status,
                data: JSON.stringify(requestData),
                startTime,
                repeat

            };

            try {
                const additionalResponse = await axios.post('http://localhost:5000/save-response', additionalRequestData);
                console.log('Additional response:', additionalResponse.data);
            } catch (error) {
                console.error('Failed to send additional request:', error);
            }


        } catch (error) {
            console.error(error);
        }

    };



    const { url, method, numData, repeat, expectedResponse } = formData;

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h3>HTTP Request</h3>
                <br>
                </br>
                <label>
                    URL:
                    <input type="text" name="url" value={url} onChange={handleInputChange} />
                </label>
                <br />
                <label>
                    Method:
                    <select name="method" value={method} onChange={handleInputChange}>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                    </select>
                </label>
                <br />
                <label>
                    Number of key-value pairs:
                    <input type="number" name="numData" value={numData} onChange={handleInputChange} />
                </label>
                <br />
                {Array.from({ length: numData }, (_, i) => (
                    <div key={i}>
                        <label>
                            Key {i + 1}:
                            <input type="text" name={`key_${i}`} onChange={handleDataInputChange} />
                        </label>
                        <label>
                            Value {i + 1}:
                            <input type="text" name={`value_${i}`} onChange={handleDataInputChange} />
                        </label>
                    </div>
                ))}
                <label>
                    Number of times to repeat:
                    <input type="number" name="repeat" value={repeat} onChange={handleInputChange} />
                </label>

                <br />
                <label>
                    Expected response:
                    <input type="text" name="expectedResponse" value={expectedResponse} onChange={handleInputChange} />

                </label>
                <br />
                <button type="submit">Submit</button>
            </form>
            <h1>Response Time and Status Code</h1>
            <table>
                <thead>
                    <tr>
                        <th>Response Time</th>
                        <th>Status Code</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{totalResponseTime}</td>
                        <td>{responseStatusCodes.length > 0 ? responseStatusCodes[0] : ''}</td>
                    </tr>
                </tbody>
            </table>
            <h1>My Requests</h1>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Method</th>
                        <th>Data</th>
                        <th>Expected Response</th>
                    </tr>
                </thead>
                <tbody>
                    {responseData.map((request, index) => (
                        <tr key={index}>
                            <td>{request.url}</td>
                            <td>{request.method}</td>
                            <td>{JSON.stringify(request.data)}</td>
                            <td>{request.expectedResponse}</td>

                            <td>
                                <button onClick={() => handleEdit(index)}>Edit</button>
                            </td>
                            <td>
                                <button onClick={() => handleSendRequest(request)}>Sending the request</button>
                            </td>
                            <td>
                                <button onClick={() => handleDelete(index)}>Delete</button>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>

            <h1>My Requests Response time and status code</h1>
            <table>
                <thead>
                    <tr>
                        <th>Response time</th>
                        <th>Status code</th>
                        <th>Data</th>
                        <th>Insert Time</th>
                        <th> repeat</th>
                    </tr>
                </thead>
                <tbody>
                    {responseData2.map((request, index) => (
                        <tr key={index}>
                            <td>{request.totalResponseTime}</td>
                            <td>{request.status_code}</td>
                            <td>{request.data}</td>
                            <td>{formatSentTime(request.startTime)}</td>
                            <td>{request.repeat}</td>
                            <td>
                                <button onClick={() => handleDeleteTime(index)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const RtpForm: React.FC = () => {
    const [rtpData, setRtpData] = useState<RtpData>({
        sourceIP: '',
        sourcePort: 0,
        destinationIP: '',
        destinationPort: 0,
        payloadType: '',
    });

    const [responseData, setResponseData] = useState<any[]>([]);
    const [responseData2, setResponseData2] = useState<any[]>([]);

    const [runRequests, setRunRequests] = useState<number>(1);

    const [responseStatusCodes, setResponseStatusCodes] = useState<number[]>([]);
    const [totalResponseTime, setTotalResponseTime] = useState<number>(0);

    const formatSentTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString(); 
    };

    useEffect(() => {
        axios.get('http://localhost:5000/requests2').then((response) => {
            setResponseData(response.data);
        });
    }, []);

    useEffect(() => {
        axios.get('http://localhost:5000/requests4').then((response) => {
            setResponseData2(response.data);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const requestResponseTimes = [];
        let response: any;
        let startTime;
        for (let i = 0; i < runRequests; i++) {
            startTime = new Date().getTime();
            response = await axios.post('http://localhost:5000/rtp', rtpData);

            const endTime = new Date().getTime();
            const responseTime = endTime - startTime;
            requestResponseTimes.push(responseTime);
            setResponseStatusCodes([response.status]);
        }
        const totalResponseTime = requestResponseTimes.reduce((sum, time) => sum + time, 0);
        setTotalResponseTime(totalResponseTime);
        const repeat = runRequests;

        const additionalRequestData = {
            totalResponseTime,
            status_code: response.status,
            data: JSON.stringify(rtpData),
            startTime,
            repeat,
        };

        const additionalResponse = await axios.post('http://localhost:5000/save-response2', additionalRequestData);
        console.log('Additional response:', additionalResponse.data);

        // Clear the form data
        setRtpData({
            sourceIP: '',
            sourcePort: 0,
            destinationIP: '',
            destinationPort: 0,
            payloadType: '',
        });
    };

    const handleSendRequest = async (request: any) => {
        const { sourceIP, sourcePort, destinationIP, destinationPort, payloadType } = request;
        let repeat = 1;

        setRtpData({
            sourceIP,
            sourcePort,
            destinationIP,
            destinationPort,
            payloadType,
        });

        // Send the RTP data to the server for the specified number of run requests

        const startTime = new Date().getTime();
        const response = await axios.post('http://localhost:5000/rtp', {
            sourceIP,
            sourcePort,
            destinationIP,
            destinationPort,
            payloadType,
        });

        setResponseStatusCodes([response.status]);
        const endTime = new Date().getTime();
        const responseTime = endTime - startTime;
        const totalResponseTime = responseTime;
        setTotalResponseTime(totalResponseTime);

        const responseServerData = {
            totalResponseTime: totalResponseTime,
            status_code: response.status,
            data: JSON.stringify(request),
            startTime: startTime,
            repeat

        };

        try {
            const responseServerResponse = await axios.post('http://localhost:5000/save-response2', responseServerData);
            console.log('Response sent to the response server:', responseServerResponse.data);
        } catch (error) {
            console.error('Failed to send response to the response server:', error);
        }


        setRtpData({
            sourceIP: '',
            sourcePort: 0,
            destinationIP: '',
            destinationPort: 0,
            payloadType: '',
        });
    };

    const handleDelete = (index: number) => {
        const newResponseData = [...responseData];

        const itemIdToDelete = newResponseData[index]._id.$oid;
        axios
            .delete(`http://localhost:5000/resource1/${itemIdToDelete}`)
            .then((response) => {
                newResponseData.splice(index, 1);
                setResponseData(newResponseData);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const handleDeleteTime = (index: number) => {
        const newResponseData = [...responseData2];

        const itemIdToDelete = newResponseData[index]._id.$oid;
        console.log('itemIdToDelete:', itemIdToDelete);
        axios.delete(`http://localhost:5000/resource5/${itemIdToDelete}`)
            .then(response => {
                newResponseData.splice(index, 1);
                setResponseData2(newResponseData);
            })
            .catch(error => {
                console.error(error);
            });
    };

    const handleEdit = (index: number) => {
        const requestData = responseData[index];

        setRtpData({
            sourceIP: requestData.sourceIP,
            sourcePort: requestData.sourcePort,
            destinationIP: requestData.destinationIP,
            destinationPort: requestData.destinationPort,
            payloadType: requestData.payloadType,
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRtpData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleRunRequestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setRunRequests(parseInt(value));
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h3>RTP Request</h3>
                <br></br>
                <label htmlFor="sourceIP">Source IP:</label>
                <input
                    type="text"
                    id="sourceIP"
                    name="sourceIP"
                    value={rtpData.sourceIP}
                    onChange={handleInputChange}
                    required
                />

                <label htmlFor="sourcePort">Source Port:</label>
                <input
                    type="number"
                    id="sourcePort"
                    name="sourcePort"
                    value={String(rtpData.sourcePort)}
                    onChange={handleInputChange}
                    required
                />

                <label htmlFor="destinationIP">Destination IP:</label>
                <input
                    type="text"
                    id="destinationIP"
                    name="destinationIP"
                    value={rtpData.destinationIP}
                    onChange={handleInputChange}
                    required
                />

                <label htmlFor="destinationPort">Destination Port:</label>
                <input
                    type="number"
                    id="destinationPort"
                    name="destinationPort"
                    value={String(rtpData.destinationPort)}
                    onChange={handleInputChange}
                    required
                />

                <label htmlFor="payloadType">Payload Type:</label>
                <input
                    type="text"
                    id="payloadType"
                    name="payloadType"
                    value={rtpData.payloadType}
                    onChange={handleInputChange}
                    required
                />

                <label htmlFor="runRequests">Run Requests:</label>
                <input
                    type="number"
                    id="runRequests"
                    name="runRequests"
                    value={String(runRequests)}
                    onChange={handleRunRequestsChange}
                    required
                />

                <button type="submit">Send RTP</button>
            </form>
            <h1>Response Time and Status Code</h1>
            <table>
                <thead>
                    <tr>
                        <th>Response Time</th>
                        <th>Status Code</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{totalResponseTime}</td>
                        <td>{responseStatusCodes.length > 0 ? responseStatusCodes[0] : ''}</td>
                    </tr>
                </tbody>
            </table>
            <table>
                <thead>
                    <tr>
                        <th>Source IP</th>
                        <th>Source Port</th>
                        <th>Destination IP</th>
                        <th>Destination Port</th>
                        <th>Payload Type</th>
                    </tr>
                </thead>
                <tbody>
                    {responseData.map((request, index) => (
                        <tr key={index}>
                            <td>{request.sourceIP}</td>
                            <td>{request.sourcePort}</td>
                            <td>{request.destinationIP}</td>
                            <td>{request.destinationPort}</td>
                            <td>{request.payloadType}</td>
                            <td>
                                <button onClick={() => handleEdit(index)}>Edit</button>
                            </td>
                            <td>
                                <button onClick={() => handleSendRequest(request)}>Sending the request</button>
                            </td>
                            <td>
                                <button onClick={() => handleDelete(index)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h1>My Requests Response time and status code</h1>
            <table>
                <thead>
                    <tr>
                        <th>Response time</th>
                        <th>Status code</th>
                        <th>Data</th>
                        <th>Insert Time</th>
                        <th>Run Requests</th>
                    </tr>
                </thead>
                <tbody>
                    {responseData2.map((request, index) => (
                        <tr key={index}>
                            <td>{request.totalResponseTime}</td>
                            <td>{request.status_code}</td>
                            <td>{request.data}</td>
                            <td>{formatSentTime(request.startTime)}</td>
                            <td>{request.repeat}</td>

                            <td>
                                <button onClick={() => handleDeleteTime(index)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <div className="App">
            <img src={logo} alt="Unit 108 Logo" className="App-logo" />
            <br>
            </br>
            <HttpForm />
            <br>
            </br>
            <RtpForm />
        </div>
    );
};

export default App;

