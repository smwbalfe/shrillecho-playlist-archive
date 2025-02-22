import WebSocketListener from '../services/websocket';

export const Home = () => {
    return (
        <main>
            <h1>Artist Scraper Dashboard</h1>
            <WebSocketListener />
        </main>
    );
}

