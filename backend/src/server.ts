import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: "Too many requests" });

app.use(express.json());
app.use('/api/', limiter);

app.get('/health', (req, res) => res.json({ status: 'Backend is running V3.0' }));

app.listen(8080, () => console.log('API Gateway running on port 8080'));\n