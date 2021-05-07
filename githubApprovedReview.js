const axios = require('axios'); 

const API_BASE_URL = 'https://api.github.com/repos';

const DEFAULT_OWNER = '/nodejs'; 
const DEFAULT_REPOS = '/node'
const PULL = '/pulls' ;
const PAGE = '?per_page='
const REVIEWS = '/reviews';

const DEFAULT_NUMBER_OF_REQUESTS = 10; 

const histogramData = {
    lessThanHour: 0, 
    betweenHourAndDay: 0, 
    moreThanDay: 0, 
}

const getApprovedReviewDate = async (pullNumber) => {
    const url = API_BASE_URL + DEFAULT_OWNER + DEFAULT_REPOS + PULL + "/" +  pullNumber + REVIEWS;
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
    
    console.log(histogramData);
}

const run = async () => {
    const url = API_BASE_URL 
                + DEFAULT_OWNER 
                + DEFAULT_REPOS 
                + PULL 
                + PAGE 
                + DEFAULT_NUMBER_OF_REQUESTS; 
    let results = null; 
    
    try {
        const response = await axios.get(url);
        console.log(response.status);

        if (response.status === 200) {
            results = response.data; 
          
            results.forEach( async (result) => {
                const pullNumber = result.number; 
                const createdDate = result.created_at; 
                const reviewDate = await getApprovedReviewDate(pullNumber);
                if(createdDate && reviewDate) compareDate(createdDate, reviewDate)
                //If there is no review, should we not add it to the histogram or should we add it to more than a day ? or should we check the current date and the created date ? 
            });
        }
    } catch (error) {
        console.error(error);
        // console.log("Attempt url was ", url);
    }

    return results; 
}

run().then(() => console.log("Done.")); 