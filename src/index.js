import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ConfigProvider } from 'antd';
import zh_HK from 'antd/locale/zh_HK';
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
<ConfigProvider locale={zh_HK}>
        <App />
        </ConfigProvider>
);
