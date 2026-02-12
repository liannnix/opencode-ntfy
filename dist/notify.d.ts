interface SendNotificationOptions {
    server: string;
    topic: string;
    title: string;
    message: string;
    priority?: number;
    tags?: string[];
}
export declare function sendNotification(opts: SendNotificationOptions): Promise<void>;
export {};
//# sourceMappingURL=notify.d.ts.map