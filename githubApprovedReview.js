//Axios will handle HTTP requests to web service
const axios = require('axios'); 
//Reads keys from .env file
const dotenv = require('dotenv');
//Copy variables in file into environment variables
dotenv.config();

const API_BASE_URL = 'https://api.github.com/repos';

const PULL =  '/pulls';
const REVIEWS = '/reviews';
const CLIENT = '?my_client_id=';
const PAGE = '&&per_page='


const histogramData = {
    lessThanHour: 0, 
    betweenHourAndDay: 0, 
    moreThanDay: 0, 
}

const getApprovedReviewDate = async (baseUrl, pullNumber) => {   
    const url = baseUrl + "/" +  pullNumber + REVIEWS + CLIENT + process.env.GITHUB_USERNAME;
    let date = null; 
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            const data  = response.data; 
            if(data && data.length > 0){
                for(let i = 0; i < data.length; i++){
                    if(data[i].state === "APPROVED"){
                        date = data[i].submitted_at; 
                        return date; 
                    } 
                }
            } 
        }
    } catch (error) {
        console.error(error);
        console.log("Attempt url was ", url);
    }

    return date; 
}

const compareDate = (createdDate, reviewDate) => {
    const date1 = new Date(createdDate);
    const date2 = new Date(reviewDate);
    const diffTime = Math.abs(date2 - date1) / (1000 * 60);
    
    if(diffTime < 60) histogramData.lessThanHour++; 
    else if ((diffTime / 60) < 24 ) histogramData.betweenHourAndDay++; 
    else histogramData.moreThanDay++; 
}

// const testCompareDate = () => {
//     const date1 = "2021-05-05T09:23:20Z"; 
//     const date2 = "2021-05-06T09:30:26Z"; 

//     compareDate(date1, date2);
// }

// testCompareDate(); 

const getHistogramData = async (  ) => {
    const baseUrl = API_BASE_URL + process.env.DEFAULT_OWNER + process.env.DEFAULT_REPOS + PULL 
    const getRequestsUrl = baseUrl + CLIENT + process.env.GITHUB_USERNAME + PAGE + process.env.DEFAULT_NUMBER_OF_REQUESTS; 
    let results = null; 
    
    try {
        const response = await axios.get(getRequestsUrl);
        console.log(response.status);

        if (response.status === 200) {
            results = response.data; 
            if(!results) return; 
            
            for (let i= 0; i < results.length; i++){
                const pullNumber = results[i].number; 
                const createdDate = results[i].created_at; 
                const reviewDate = await getApprovedReviewDate(baseUrl, pullNumber);
                if(createdDate && reviewDate) compareDate(createdDate, reviewDate); 
            }

        }
    } catch (error) {
        console.error(error);
        console.log("Attempt url was ", getRequestsUrl);
    }
}

const run =  async () => {
    try {
       await getHistogramData().then(() => {console.log("Result = ", histogramData)});  
    }catch (error) {
        console.error(error);
    }
}

run(); 