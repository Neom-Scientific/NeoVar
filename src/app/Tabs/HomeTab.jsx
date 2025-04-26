import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Cookies from 'js-cookie';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      label: 'Sales',
      data: [12, 19, 3, 5, 2],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Monthly Sales Data',
    },
  },
};

const optionsDoughnut = {
responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Vote Distribution',
              },
            },
}

const dataDoughnut = {
  labels: ['Red', 'Blue', 'Yellow'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
      ],
    },
  ],
}

const dataLine = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      label: 'Sales',
      data: [12, 19, 3, 5, 2],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      fill: false,
    },
    {
      label: 'Expenses',
      data: [10, 15, 5, 8, 3],
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      fill: false,
    },
  ],
};
const optionsLine = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Monthly Sales Data',
    },
  },
};

const HomeTab = () => {
const [counterData, setCounterData] = useState(null);
  const [apiCall, setApiCall] = useState(false);
  const [ notFound, setNotFound ] = useState('');
 let email;
    const user = Cookies.get('user');
    if (user) {
        try {
            const parsedUser = JSON.parse(user);
            email = parsedUser.email;
        }
        catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    else {
        console.log('User data:', user);
    }

  useEffect(() => {
    const fetchCounterData = async () => {
      try {
        const response = await axios.get(`/api/read-counter-json?email=${email}`);
        // console.log('Counter data:', response.data);
        if(response.data.error){
          // console.log(response.data.error);
          setNotFound(response.data.error);
        }
        setCounterData(response.data);
        setApiCall(true);
      } catch (error) {
        console.error('Error fetching counter data:', error);
      }
    };
    fetchCounterData();
  }, [apiCall]);
  return (
    <div className='mx-7'>
      {/* <h1 className='text-2xl font-bold mb-4'>Dashboard</h1> */}

      <Table>
        <TableHeader className="">
          <TableRow>
            <TableHead>Project Number</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Analysis Progress</TableHead>
            <TableHead>Creation Time</TableHead>
            {/* <TableHead>Total Time</TableHead> */}
            <TableHead>Analysis Status</TableHead>
            <TableHead>Number of Sample</TableHead>
            <TableHead>Operation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className='text-sm font-medium text-justify-center'>
        {counterData && Array.isArray(counterData) && counterData.length > 0 ? (
            counterData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.projectid}</TableCell>
                <TableCell>{item.projectname}</TableCell>
                <TableCell>{item.progress}%</TableCell>
                <TableCell>{new Date(parseInt(item.creationtime)).toLocaleString()}</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>{item.numberofsamples}</TableCell>
                <TableCell>
                  <button className='text-blue-500 hover:underline cursor-pointer'>Download Report</button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="7" className="text-center text-lg">
               {notFound}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      
      {/* <div className='flex justify-start'>
      
      <div className='h-[500px] w-[500px]'>
      <Bar data={data} options={options} />
      </div>
      <div className='h-[500px] w-[500px]'>
        <Doughnut data={dataDoughnut} options={optionsDoughnut} />
        </div>
        <div className='h-[500px] w-[500px]'>
<Line data={dataLine} options={optionsLine} />
        </div>
      </div> */}
    </div>
  );
};

export default HomeTab;

// import React from 'react'

// const HomeTab = () => {
//   return (
//     <div className='mx-7'>
   

//     </div>
//   )
// }

// export default HomeTab