export declare const jwtConstants: {
    access: {
        privateKeyPath: string;
        publicKeyPath: string;
        expiresIn: string;
        algorithm: "RS256";
    };
    refresh: {
        secret: string;
        expiresIn: string;
        algorithm: "HS256";
    };
};
