import React from 'react';
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
  return (
    <div className='mx-7'>
      {/* <h1 className='text-2xl font-bold mb-4'>Dashboard</h1> */}
      
      <div className='flex justify-start'>
      
      <div className='h-[500px] w-[500px]'>
      <Bar data={data} options={options} />
      </div>
      <div className='h-[500px] w-[500px]'>
        <Doughnut data={dataDoughnut} options={optionsDoughnut} />
        </div>
        <div className='h-[500px] w-[500px]'>
<Line data={dataLine} options={optionsLine} />
        </div>
      </div>
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