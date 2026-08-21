require("dotenv").config()
const app= require("./src/app");
const connectDB= require("./src/db/db")
const PORT=process.env.PORT;

async function startServer(params) {
    try {
        await connectDB();
        app.listen(PORT,()=>{
            console.log(`The server is running on the http://localhost:${PORT}`)
        })
    } catch (error) {
        console.log(`Error from the starting the server : ${error}`)
    }
} 

startServer()
