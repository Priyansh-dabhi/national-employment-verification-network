import dotenv from 'dotenv'
dotenv.config();

import express from "express";
import cors from 'cors'
import http from 'http'
import pool from "./src/db.js";



let app = express();
app.use(express.json());
app.use(cors());


app.get("/", (req,res)=>{
    res.send("server is running")
})
app.get("/home", (req,res)=>{
    res.send("Home")
})
console.log("Password", process.env.DB_PASSWORD)
app.get("/db-test", async (req, res) => {
    
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("DB connection failed");
    }
});

let PORT = process.env.PORT || 3000 ;
let server = http.createServer(app);

server.listen(PORT,()=>{
    console.log("Server is running on port: ",PORT)
})
