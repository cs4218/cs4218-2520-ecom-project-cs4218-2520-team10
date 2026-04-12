import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0", // Specify the OpenAPI version
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "API documentation for the E-commerce application",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 6060}`, // Base URL for your API
      },
    ],
    components: {
      securitySchemes: {
        Authorization: {
          type: "apiKey",
          in: "header",
          name: "authorization",
          description: "Enter JWT Bearer token **_only_**",
        },
      },
    },
    security: [
      {
        Authorization: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};
const specs = swaggerJsdoc(swaggerOptions);

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
