import React, { useState, useEffect } from 'react';

interface DataItem {
    key_0: string;
    value_0: string;
    expected_response: string | null;
}

function DataTable() {
    const [data, setData] = useState<DataItem[]>([]);

    useEffect(() => {
        fetch('http://localhost:5000/')
            .then(response => response.json())
            .then(data => {
                console.log(data); 
                setData(data);
                console.log(data); 
            })
            .catch(error => console.log(error));
    }, []);

    return (
        <table>
            <thead>
                <tr>
                    <th>Field 1</th>
                    <th>Field 2</th>
                    <th>Field 3</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index}>
                        <td>{item.key_0}</td>
                        <td>{item.value_0}</td>
                        <td>{item.expected_response}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
