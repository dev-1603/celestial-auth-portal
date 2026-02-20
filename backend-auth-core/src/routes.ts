import express, { type Application, type Request, type Response } from 'express';
import { emailAuthRouter } from './modules/auth/email/routes';

const router = express.Router();

// routes
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Hello World' });
});

router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

router.use("/auth/email", emailAuthRouter);

export const registerRoutes = (app: Application): void => {
    app.use(router);

    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: 'ROUTE_NOT_FOUND',
            path: req.originalUrl,
        });
    });
};
