import utilStyles from '../styles/utils.module.css';
import React from 'react';
import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  forwardRef
} from 'react';
import Row from './Row';
import BoardTask from './BoardTask';
import Confetti from 'react-confetti'
import { readGame, updateGame, evaluations } from '../utils/utils';
import { isMobile } from 'react-device-detect';
import {CopyToClipboard} from 'react-copy-to-clipboard';

interface Props {
  winningWord: string,
  gameId: string,
  isSinglePlayer: boolean,
  playerName: string,
  isFirst: boolean
};

interface BoardState {
  [key: number]: {
    readOnly: boolean;
    guess: any;
    evaluation: any;
  };
};

interface GuessState {
  boardState: BoardState,
  alphabetState: any,
  gameOverMsg?: string,
  gameOver: boolean,
  win: boolean,
  isSinglePlayer: boolean,
  winningWord: string,
  playerName: string,
  gameId: string,
  isFirst: boolean,
  player0?: string,
  player1?: string,
  waitingFor?: string,
  isCopied: boolean
};

class Board extends React.Component<Props, GuessState>  {

  constructor(props: Props) {
    super(props);
    const boardState1 = {
      0: {readOnly: !props.isFirst, guess: null, evaluation: null},
      1: {readOnly: true, guess: null, evaluation: null},
      2: {readOnly: true, guess: null, evaluation: null},
      3: {readOnly: true, guess: null, evaluation: null},
      4: {readOnly: true, guess: null, evaluation: null},
      5: {readOnly: true, guess: null, evaluation: null}
    };
    let alphabetState1 = {"A": "", "B":"", "C":"", "D":"", "E":"", "F":"", "G":"", "H":"", "I":"", "J":"", "K":"", "L":"", "M":"", "N":"", "O":"", "P":"", "Q":"", "R":"", "S":"", "T":"", "U":"", "V":"", "W":"", "X":"", "Y":"", "Z":""};
    let win1 = false
    let isSinglePlayer1 = props.isSinglePlayer;
    let winningWord1 = props.winningWord;
    let playerName1 = props.playerName;
    let gameId1 = props.gameId;
    let isFirst1 = props.isFirst;
    let player01 = null;
    let player11 = null;
    if (isFirst1) {
      player01 = playerName1;
    } else {
      player11 = playerName1;
    }
    this.state = {boardState: boardState1, alphabetState:alphabetState1, gameOverMsg:null, gameOver:false, win:win1, isSinglePlayer:isSinglePlayer1, winningWord: winningWord1, playerName: playerName1, gameId: gameId1, isFirst: isFirst1, player0:player01, player1:player11, waitingFor:"", isCopied:false};
    this.focusNext = this.focusNext.bind(this);
    this.updateState = this.updateState.bind(this);
    this.alphaHelper = this.alphaHelper.bind(this);
    this.sayCopied = this.sayCopied.bind(this);
  }

  sayCopied() {
    this.setState(Object.assign(this.state, {isCopied: true}))
    setTimeout(() => {
      this.setState(Object.assign(this.state, {isCopied: false}))
    }, 1000);
  };

  // reads game from DB and sees if other player played a word
  async updateState(meFirst) {
    if (!this.state.isSinglePlayer) {
      let game = await readGame(this.state.gameId);
      if (game == null) {return false;}

      let didChange = false;
      let newState = Object.assign(this.state);
      if (this.state.player0 == null && game.player0 != null) {
        newState = Object.assign(newState, { player0: game.player0 });
        didChange = true;
      }

      if (this.state.player1 == null && game.player1 != null) {
        newState = Object.assign(newState, { player1: game.player1 });
        didChange = true;
      }

      if ((game.guesses.length) % 2 == 0) { 
        if (this.state.waitingFor != game.player0) {
          newState = Object.assign(newState, { waitingFor: game.player0 });
          didChange = true;
        }
      } else {
        if (this.state.waitingFor != game.player1) {
          if (game.player1 != null) {
            newState = Object.assign(newState, { waitingFor: game.player1 });
          } else {
            newState = Object.assign(newState, { waitingFor: "friend" });
          }
          didChange = true;
        }
      }

      if (didChange) {
        this.setState(newState);
      }
      
      for (let i = 0; i < game.guesses.length; i++) {
        let currWordGuess = this.state.boardState[i].guess;
        let dbGameGuess = game.guesses[i].toUpperCase();   
        // we've already seen the word and evaluated    
        if (currWordGuess != null) {
          if (currWordGuess.toUpperCase() != dbGameGuess.toUpperCase()) {
            console.log("   Doesn't match with DB: (boardState)" + currWordGuess + " : (db)"+ dbGameGuess);
          } 
        // there's a guessed word that isn't in our state
        } else {
          let newBoardState = Object.assign(this.state.boardState)
          newBoardState[i].guess = dbGameGuess;
          let evaluationWord = evaluations(Object.assign([], dbGameGuess), this.state.winningWord, Object.assign([], this.state.winningWord)); 
          newBoardState[i].evaluation = evaluationWord;
          newState = Object.assign(newState, {boardState: newBoardState})

          this.alphaHelper(dbGameGuess.toUpperCase(), evaluationWord);

          let correct = utilStyles.wordBoxCorrect;
          if (evaluationWord[0] == correct && evaluationWord[1] == correct && evaluationWord[2] == correct && evaluationWord[3] == correct && evaluationWord[4] == correct) {
              // check if it was my guess
            if (i % 2 == 0 && meFirst) { 
              let tries = i+1;
              let newGameOverMsg = "Congrats, you win!\nYou guessed " + this.props.winningWord.toUpperCase() + " in " + tries + " tries.";
              newState = Object.assign(newState, { win: true }, { gameOver: true }, {gameOverMsg: newGameOverMsg});
            } else {
              
              let p = game.player1;
              if (meFirst) {
                p = game.player0;
              }

              evaluationWord[0] = utilStyles.wordBoxMultiLost;
              evaluationWord[1] = utilStyles.wordBoxMultiLost;
              evaluationWord[2] = utilStyles.wordBoxMultiLost;
              evaluationWord[3] = utilStyles.wordBoxMultiLost;
              evaluationWord[4] = utilStyles.wordBoxMultiLost;
              let newBoardState = Object.assign(this.state.boardState)
              newBoardState[i].evaluation = evaluationWord;
              let newGameOverMsg = "You lose to " + p + "! The word was " + this.props.winningWord.toUpperCase();
              newState = Object.assign(newState, {boardState: newBoardState}, { win: false }, { gameOver: true }, {gameOverMsg: newGameOverMsg});
            }
            this.setState(newState);
            return true;
          } else if (i >= 5) {
            let newGameOverMsg = "Both players lose! The word was " + this.props.winningWord.toUpperCase();
            newState = Object.assign(newState, { win: false }, { gameOver: true }, {gameOverMsg: newGameOverMsg});
            this.setState(newState);
            return true;
          } else {
            return false;
          }
        }
      }

      return true;
    }
  }

  focusNext(rowNum, guessedWord, evaluationWord) {
    let currRow = rowNum; 
    rowNum++; 
    let nextRow = rowNum;
    
    let newBoardState = { ... this.state.boardState };
    newBoardState[currRow].readOnly = true;
    newBoardState[currRow].guess = guessedWord;
    newBoardState[currRow].evaluation = evaluationWord;

    let newState = Object.assign(this.state, {boardState: newBoardState})

    this.alphaHelper(guessedWord.toUpperCase(), evaluationWord);

    let correct = utilStyles.wordBoxCorrect;
    if (evaluationWord[0] == correct && evaluationWord[1] == correct && evaluationWord[2] == correct && evaluationWord[3] == correct && evaluationWord[4] == correct) {
       let newGameOverMsg = "Congrats, you win!\nYou guessed " + this.props.winningWord.toUpperCase() + " in " + rowNum + " tries.";
       newState = Object.assign(newState, { win: true }, { gameOver: true }, {gameOverMsg: newGameOverMsg});
    } else if (nextRow < 6) {
      if (this.state.isSinglePlayer) {
       newBoardState[nextRow].readOnly = false;
       newState = Object.assign(newState, {boardState: newBoardState})
      }
    } else {
       let newGameOverMsg =  "You lose! The word was " + this.props.winningWord.toUpperCase();
       newState = Object.assign(newState, { win: false }, { gameOver: true }, {gameOverMsg: newGameOverMsg});
    }
    this.setState(newState);
    
}

alphaHelper(guessedWord, evaluationWord) {
  let newArr2 = { ... this.state.alphabetState };
  let correct = utilStyles.wordBoxCorrect;
  let present = utilStyles.wordBoxPresent;
  let absent = utilStyles.wordBoxAbsent;
  for (let i=0; i < 5; i++) {
    let letter = guessedWord.charAt(i);
    let evaluation = evaluationWord[i];
    let existingEvaluation = this.state.alphabetState[letter];
    if (existingEvaluation != "") {
      if ((existingEvaluation == correct) || (existingEvaluation == present && evaluation == absent)) {
                    // do nothing
      } else {
        newArr2[letter] = evaluation;
      }
    } else {
      newArr2[letter] = evaluation;
    }
  }
  let newState = Object.assign(this.state, {alphabetState: newArr2})
  this.setState(newState);
}


render() {
  this.updateState(this.props.isFirst);
  let even = true;
  let odd = false;  
  if (this.props.isSinglePlayer) {
    odd = true;
  } else if (!this.props.isFirst) {
    even = false;
    odd = true;
  }

  const Row0 = forwardRef((props, ref) => (
    <Row rowNum={0} ref={ref} gameId={this.props.gameId} winningWord={this.props.winningWord} boardState={this.state.boardState} updateStateFunc={this.updateState} focusNextFunc={this.focusNext} myName={this.props.playerName} isMyTurn={even} isSinglePlayer={this.props.isSinglePlayer} /> ));
  const Row1 = forwardRef((props, ref) => (
    <Row rowNum={1} ref={ref} gameId={this.props.gameId} winningWord={this.props.winningWord} boardState={this.state.boardState} updateStateFunc={this.updateState} focusNextFunc={this.focusNext} myName={this.props.playerName} isMyTurn={odd} isSinglePlayer={this.props.isSinglePlayer}  /> ));
  const Row2 = forwardRef((props, ref) => (
    <Row rowNum={2} ref={ref} gameId={this.props.gameId} winningWord={this.props.winningWord} boardState={this.state.boardState} updateStateFunc={this.updateState} focusNextFunc={this.focusNext} myName={this.props.playerName} isMyTurn={even} isSinglePlayer={this.props.isSinglePlayer}  /> ));
  const Row3 = forwardRef((props, ref) => (
    <Row rowNum={3} ref={ref} gameId={this.props.gameId} winningWord={this.props.winningWord} boardState={this.state.boardState} updateStateFunc={this.updateState} focusNextFunc={this.focusNext} myName={this.props.playerName} isMyTurn={odd} isSinglePlayer={this.props.isSinglePlayer}  /> ));
  const Row4 = forwardRef((props, ref) => (
    <Row rowNum={4} ref={ref} gameId={this.props.gameId} winningWord={this.props.winningWord} boardState={this.state.boardState} updateStateFunc={this.updateState} focusNextFunc={this.focusNext} myName={this.props.playerName} isMyTurn={even} isSinglePlayer={this.props.isSinglePlayer}  /> ));
  const Row5 = forwardRef((props, ref) => (
    <Row rowNum={5} ref={ref} gameId={this.props.gameId} winningWord={this.props.winningWord} boardState={this.state.boardState} updateStateFunc={this.updateState} focusNextFunc={this.focusNext} myName={this.props.playerName} isMyTurn={odd} isSinglePlayer={this.props.isSinglePlayer}  /> ));   

  let player0 = this.state.player0;
  let player1 = this.state.player1;
  let showVs = "vs.";

  if (!this.props.isSinglePlayer) {
    if (this.state.isFirst) {
      player0 = player0 + " (you)";
      if (this.state.player1 == null) {
        player1 = "waiting for a friend ...";
      }
    } else {
      player1 = player1 + " (you)";
    }
  } else {
    player0 = "";
    showVs = "";
  }

  let breakNum = isMobile? 9 : 13;
  let displayTurn = !this.props.isSinglePlayer && (this.state.gameOver != true);
  let doTask = !this.props.isSinglePlayer && (this.state.gameOver != true);

  return (
      <div className={utilStyles.center}> 
        {this.state.win && <Confetti run={false} />}

        <span className="text-center">
          Game ID: {this.props.gameId} 
          <CopyToClipboard text={this.props.gameId} onCopy={() => this.sayCopied()}>
              <i className="fa">&#x2398;</i>
          </CopyToClipboard> <br/>
          {this.state.isCopied && <span className="text-slate-300 text-right"> Copied! </span>} <br/>
        </span>

        {this.props.isFirst && <span><strong>{player0}</strong> <em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{showVs}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</em> {player1} </span>}
        {!this.props.isFirst && <span>{player0}<strong> <em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{showVs}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</em>{player1}</strong></span>}
<br/>
        {doTask &&  <BoardTask updateStateFunc={this.updateState} meFirst={this.props.isFirst} player0={player0}  player1={player1} /> }
        <Row0 /> 
        <Row1 />
        <Row2 /> 
        <Row3 /> 
        <Row4 />
        <Row5 /> 
        <br/>
        {displayTurn  &&  <em><br/>{this.state.waitingFor}'s turn... </em>}
        {this.state.gameOver  &&  <strong><br/>{this.state.gameOverMsg}</strong>}
        <br/>
        <div className={utilStyles.center }><br/>
          {Object.keys(this.state.alphabetState).map((key, index) => {
            let addBreak = ((index+1) % breakNum == 0) ? <br/> : ""
            let state1 = this.state.alphabetState[key]
            return ( 
             <span key={key}>
             <span className={utilStyles.alphabetBox + " " + state1}>{key}</span> 
             {addBreak}{addBreak}{addBreak}
             </span>
             );
          })}
        </div>  
      </div>
    );
}
}

export default Board;
