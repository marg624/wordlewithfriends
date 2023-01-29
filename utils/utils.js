import utilStyles from '../styles/utils.module.css';
import dictionary from '../resources/5-letter-words.js';

export const getOccurrences = (letter, word) => {
    var count = (word.split(letter)).length - 1;
    return count;
}

export const evaluation = (index, wordArray, winningWord, winningWordArray) => {
    let letter = wordArray[index]
    // if letter is in the right spot - correct
    if (winningWordArray[index] == letter) {
        return utilStyles.wordBoxCorrect;
    }

    // if letter is there but wrong spot - present
    if (winningWord.includes(letter)) {
        var letterOccur = getOccurrences(letter, winningWord);
        var wordCut = wordArray.slice(0, index).join("");
        var letterSeen = getOccurrences(letter, wordCut);
        if (letterSeen < letterOccur) {
         return utilStyles.wordBoxPresent;
     }
 }

    // if letter is not there - absent
 return utilStyles.wordBoxAbsent;
}

export const evaluations = (wordArray, winningWord, winningWordArray) => {
    let evals = ['','','','',''];
    const word = wordArray.join("");
    if (word.toLowerCase() == winningWord) {
    }

    let i = 0;
    const state = evals.map((c, index) => {
        if (i === index) {
            let a = evaluation(i, wordArray, winningWord, winningWordArray);
            i++;
            return a;
        } else {
            i++;
            return c;
        }
    });
    return state;
}

export const isWord = (word) => {
    return dictionary.words.includes(word.toLowerCase());
}

export const currTurn = (boardStateGuesses) => {
    for (let i=0; i < 6; i++) {
        if(boardStateGuesses[i].guess=="" || boardStateGuesses[i].guess==null) {
            return i;
        }
    }
    return null;
}

export const readGame = (gameId) => {
    let urlRead = 'http://localhost:8080/get?gameId=' + gameId; // var data = await 
    let dataResp = fetch(urlRead, {
        method: 'GET',
        headers: {
         'Content-type': 'application/json; charset=UTF-8',
         'Access-Control-Allow-Origin': '*'
     },
 })
    .then((response) => {
        return  response.json();
    })
    .catch(err => {console.log(err.message);
        return null;
    });  
    return dataResp;    
}

export const createGame = (gameId, word, player) => {
  let urlWrite = 'http://localhost:8080/create?gameId=' + gameId;
  const state = {
    player0: player,
    winningWord: word,
    guesses: []
};

let bodyJson = JSON.stringify(state)

fetch(urlWrite, {
    method: 'POST',
    body: bodyJson,
    data: bodyJson,
    headers: {
     'Content-type': 'application/json; charset=UTF-8',
     'Access-Control-Allow-Origin': '*'
 },
})
.catch((err) => {
 console.log("ERROR: " + err.message);
}); 
}

export const updateGame = (gameId, playerName, guessedWord) => {
    //let urlWrite = 'https://mxkqird8ei.execute-api.us-west-2.amazonaws.com/default/write-board';
    let urlWrite = 'http://localhost:8080/update?gameId=' + gameId;


    const updateData = {
     player: playerName,
     guess: guessedWord,
 };

 let bodyJson = JSON.stringify(updateData)
 let resp = true;

 fetch(urlWrite, {
    method: 'POST',
    body: bodyJson,
    data: bodyJson,
    headers: {
     'Content-type': 'application/json; charset=UTF-8',
     'Access-Control-Allow-Origin': '*'
 },
})
 .catch((err) => {
     console.log("ERROR: " + err.message);
     resp = false;
 });     
 return resp;   
}





