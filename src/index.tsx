import ReactDOM from 'react-dom/client';
import { FrontPage } from './components/FrontPage';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    // <React.StrictMode>
    <FrontPage />,
    // </React.StrictMode>,
);
