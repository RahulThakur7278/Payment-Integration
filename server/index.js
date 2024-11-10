// const express = require("express");
// const app = express();
// const cors = require("cors");
// const axios = require("axios");

// const corsOptions = {
//   origin: "http://localhost:3000",
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));

// // app.use(bodyParser.urlencoded({ extended: false }))
// app.use(express.json());

// const sha256 = require("sha256");
// const uniqid = require("uniqid");

// const PORT = 8000;

// const successUrl = "http://localhost:3000/success"
// const failUrl = "http://localhost:3000/fail"

// const HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
// const MERCHANT_ID = "PGTESTPAYUAT86";
// const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";
// const SALT_INDEX = 1;
// const merchantTransactionId = uniqid();
// const userId = 123;

// app.post("/pay", async (req, res) => {
//   console.log("SERVER :",req.body);
  
//   try {
//     let { name, number, amount } = req.body;

//     const END_POINT = "/pg/v1/pay";

//     const payload = {
//       merchantId: MERCHANT_ID,
//       merchantTransactionId: merchantTransactionId,
//       merchantUserId: userId,
//       amount: amount * 100,
//       name: name,
//       redirectUrl: `http://localhost:8000/status?id=${merchantTransactionId}`,
//       redirectMode: "POST",
//       mobileNumber: number,
//       paymentInstrument: {
//         type: "PAY_PAGE",
//       },
//     };

//     const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
//     const base63EncodedPayload = bufferObj.toString("base64");
//     const xVerify =
//       sha256(base63EncodedPayload + END_POINT + SALT_KEY) + "###" + SALT_INDEX;

//     const options = {
//       method: "POST",
//       url: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
//       headers: {
//         accept: "application/json",
//         "Content-Type": "application/json",
//         "X-VERIFY": xVerify,
//       },
//       data: {
//         request: base63EncodedPayload,
//       },
//     };

     

//       try{
//         const response = await axios.request(options);
//         console.log("RESPONSE : ",response.data.data.instrumentResponse.redirectInfo);
//         let resUrl = response.data.data.instrumentResponse.redirectInfo.url;
//         res.json({msg:"OK",url:resUrl}).status(200)
         
        
//       }catch(err){
//         console.log("ERROR : ", err);
        
//       }

//     app.post("/status", async (req, res) => {
//       const merchantTransactionId = req.query.id;
//       console.log(merchantTransactionId);
      
//       const merchantId = MERCHANT_ID;
//       if (merchantTransactionId) {
//         const xVerify =
//           sha256(
//             `/pg/v1/status/${merchantId}/${merchantTransactionId}` + SALT_KEY
//           ) +
//           "###" +
//           SALT_INDEX;

//         const options = {
//           method: "GET",
//           url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
//           headers: {
//             accept: "application/json",
//             "Content-Type": "application/json",
//             "X-MERCHANT-ID": merchantId,
//             "X-VERIFY": xVerify,
//           },
//         };

//         await axios.request(options).then((response)=>{
//           console.log("Status :",response);
//           if(response.data.success == true){
//             return res.redirect(successUrl)
//           }
          
//         }).catch((err)=>{
//           console.log("ERROR ::::",err);
//           return res.redirect(failUrl)
          
//         })
//       }
//     });




//   } catch (err) {
//     console.log(err);
//   }













  
// });



// app.get("/", (req, res) => {
//   res.send("HOME PAGE");
// });

// app.listen(PORT, (req, res) => {
//   console.log("server running on PORT :", PORT);
// });

/*....................................................*/
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const sha256 = require("sha256");
const uniqid = require("uniqid");

const app = express();
const PORT = 8000;

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

// Constants for PhonePe API
const HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT86";
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const SALT_INDEX = 1;

const successUrl = "http://localhost:3000/success";
const failUrl = "http://localhost:3000/fail";

app.post("/pay", async (req, res) => {
  const { name, number, amount } = req.body;
  const merchantTransactionId = uniqid();
  const redirectUrl = `http://localhost:8000/status?id=${merchantTransactionId}`;

  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: 123,
    amount: amount * 100,
    name,
    redirectUrl,
    redirectMode: "POST",
    mobileNumber: number,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  try {
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const xVerify = sha256(base64Payload + "/pg/v1/pay" + SALT_KEY) + "###" + SALT_INDEX;

    const options = {
      method: "POST",
      url: `${HOST_URL}/pg/v1/pay`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      data: { request: base64Payload },
    };

    const response = await axios.request(options);
    const redirectInfoUrl = response.data.data.instrumentResponse.redirectInfo.url;
    res.status(200).json({ msg: "OK", url: redirectInfoUrl });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ msg: "Payment initiation failed", error: error.message });
  }
});

app.post("/status", async (req, res) => {
  const { id: merchantTransactionId } = req.query;

  if (!merchantTransactionId) {
    return res.status(400).json({ msg: "Transaction ID is required" });
  }

  const statusEndpoint = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
  const xVerify = sha256(statusEndpoint + SALT_KEY) + "###" + SALT_INDEX;

  try {
    const options = {
      method: "GET",
      url: `${HOST_URL}${statusEndpoint}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-MERCHANT-ID": MERCHANT_ID,
        "X-VERIFY": xVerify,
      },
    };

    const response = await axios.request(options);
    const paymentStatus = response.data?.data?.status; 
    if (paymentStatus === "PAYMENT_SUCCESS") {
      return res.redirect(successUrl);
    } else if (paymentStatus === "PAYMENT_PENDING") {
      return res.redirect(failUrl); 
    } else {
      return res.redirect(failUrl);
    }
  } catch (error) {
    console.error("Status Check Error:", error);
    res.redirect(failUrl);
  }
});

app.get("/", (req, res) => {
  res.send("HOME PAGE");
});

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
