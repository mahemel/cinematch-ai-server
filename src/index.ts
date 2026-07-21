import express, {
    NextFunction,
    type Express,
    type Request,
    type Response,
} from "express";
import {
    Collection,
    Filter,
    MongoClient,
    ObjectId,
    ServerApiVersion,
    Sort,
} from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";

dotenv.config();

const app: Express = express();
const port = Number(process.env.PORT) || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
    res.send("FragranceHub Backend is running");
});

const uri = process.env.MONGODB_URI;
const DB = process.env.MONGODB_NAME;

if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable.");
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

interface MovieDocument {
    _id: ObjectId;
    title: string;
    rating: number;
    genres: string[];
    duration: number;
    createdAdd: Date;
    // ...
}
export async function runStableAPIConnect() {
    try {
        const database = client.db(DB);
        const usersCollection = database.collection("user");

        const verifyToken = async (
            req: Request,
            res: Response,
            next: NextFunction,
        ) => {
            const authHeader = req?.headers.authorization;

            if (!authHeader) {
                return res.status(401).send({ message: "Unauthorized access" });
            }
            const token = authHeader.split(" ")[1];

            if (!token) {
                return res.status(401).send({ message: "Unauthorized access" });
            }
            try {
                const { payload } = await jwtVerify(token, JWKS);

                next();
            } catch (error) {
                return res.status(403).json({ message: "Forbidden" });
            }
        };

        //Get User/users
        app.get("/api/users", async (req: Request, res: Response) => {
            const { id } = req.query;

            if (typeof id === "string") {
                const result = await usersCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!result) {
                    return res.status(404).send({
                        message: "User not found",
                    });
                }

                return res.send(result);
            }

            const result = await usersCollection.find().toArray();
            const totalUsers = await usersCollection.countDocuments();

            res.send({ totalUsers, result });
        });
    } finally {
        // await client.close();
    }
}
runStableAPIConnect().catch(console.dir);

export default app;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
