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
    res.send("Cinematch-Ai Server is running");
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
}

export async function runStableAPIConnect() {
    try {
        const database = client.db(DB);
        const usersCollection = database.collection("user");
        const movieCollection = database.collection("movies");

        const moviesCollection: Collection<MovieDocument> =
            database.collection<MovieDocument>("movies");

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
            try {
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
            } catch (error) {
                console.error("USERS API ERROR:", error);

                res.status(500).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal Server Error",
                });
            }
        });

        //Add Movie
        // app.post(
        //     "/api/add/movie",
        //     verifyToken,
        //     async (req: Request, res: Response) => {
        //         const data = req.body;
        //         const movie = {
        //             ...data,
        //             createdAdd: new Date(),
        //         };

        //         const result = await movieCollection.insertOne(movie);
        //         res.send(result);
        //     },
        // );

        // app.get("/api/movies", async (req: Request, res: Response) => {
        //     const { id } = req.query;

        //     if (typeof id === "string") {
        //         const result = await movieCollection.findOne({
        //             _id: new ObjectId(id),
        //         });

        //         if (!result) {
        //             return res.status(404).send({
        //                 message: "Item not found",
        //             });
        //         }

        //         return res.send(result);
        //     }

        //     const result = await movieCollection.find().toArray();

        //     res.send(result);
        // });

        // app.get(
        //     "/api/users/movies/:userId",
        //     async (req: Request, res: Response) => {
        //         const { userId } = req.params;

        //         const query = { addedBy: userId };
        //         console.log(query);

        //         const total = await moviesCollection.countDocuments(query);

        //         const movies = await moviesCollection
        //             .find(query)
        //             .sort({ createdAdd: -1 })
        //             .toArray();

        //         res.send({
        //             total,
        //             movies,
        //         });
        //     },
        // );

        // app.get("/api/filter/movies", async (req: Request, res: Response) => {
        //     try {
        //         const query: Filter<MovieDocument> = {};
        //         const sort: Record<string, 1 | -1> = {};

        //         const search = req.query.search as string | undefined;
        //         const genres = req.query.genres as string | undefined;
        //         const sortBy = req.query.sortBy as string | undefined;

        //         if (search) {
        //             query.$or = [
        //                 {
        //                     title: {
        //                         $regex: search,
        //                         $options: "i",
        //                     },
        //                 },
        //                 {
        //                     genres: {
        //                         $regex: search,
        //                         $options: "i",
        //                     },
        //                 },
        //             ];
        //         }
        //         if (genres) {
        //             query.genres = {
        //                 $regex: `^${genres}$`,
        //                 $options: "i",
        //             };
        //         }

        //         switch (sortBy) {
        //             case "rating-desc":
        //                 sort.rating = -1;
        //                 break;

        //             case "rating-asc":
        //                 sort.rating = 1;
        //                 break;

        //             case "year-desc":
        //                 sort.year = -1;
        //                 break;

        //             case "year-asc":
        //                 sort.year = 1;
        //                 break;

        //             case "title-asc":
        //                 sort.title = 1;
        //                 break;

        //             case "title-desc":
        //                 sort.title = -1;
        //                 break;

        //             default:
        //                 sort.year = -1;
        //         }

        //         const page = Number(req.query.page) || 1;
        //         const perPage = Number(req.query.perPage) || 8;

        //         const total = await moviesCollection.countDocuments(query);

        //         const movies = await moviesCollection
        //             .find(query)
        //             .sort(sort)
        //             .skip((page - 1) * perPage)
        //             .limit(perPage)
        //             .toArray();

        //         res.send({
        //             total,
        //             currentPage: page,
        //             perPage,
        //             totalPages: Math.ceil(total / perPage),
        //             movies,
        //         });
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send({ message: "Server error" });
        //     }
        // });

        // app.delete(
        //     "/api/movies/:id",
        //     verifyToken,
        //     async (req: Request<{ id: string }>, res: Response) => {
        //         const { id } = req.params;

        //         const query: Filter<MovieDocument> = {
        //             _id: new ObjectId(id),
        //         };

        //         const result = await moviesCollection.deleteOne(query);

        //         res.send(result);
        //     },
        // );
    } finally {
        // await client.close();
    }
}
runStableAPIConnect().catch(console.dir);

export default app;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
