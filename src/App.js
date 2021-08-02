import './App.css';
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://itransition-summer-task5.herokuapp.com/");

function App() {

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [tool, setTool] = useState("cursor");
  const [mouseState, setMouseState] = useState("up");
  const [currentColor, setCurrentColor] = useState("black");
  
  socket.off("emitSendElement").on("emitSendElement", (data) => {
    const { x, y, tool, mouseState, currentColor } = data;
    if (mouseState === "down"){
      contextRef.current.strokeStyle = (tool === "eraser") ? "white" : currentColor;
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      contextRef.current.lineWidth = (tool === "eraser") ? 10 : 3;
    } else if (mouseState === "move"){
      contextRef.current.strokeStyle = (tool === "eraser") ? "white" : currentColor;
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    } else if (mouseState === "up"){
      contextRef.current.closePath();
    }
  });

  socket.off("emitSendText").on("emitSendText", (data) => {
    const { textInput, x, y } = data;
    contextRef.current.fillText(textInput, x, y);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx.font = "20px serif";

    contextRef.current = ctx;
  }, []);

  const cursorToDefault = () => {
    document.body.style.cursor = "default";
    setTool("cursor");
  };

  const cursorToDraw = (e) => {
    const color = e.target.id;
    setCurrentColor(color);
    document.body.style.cursor = "crosshair";
    contextRef.current.strokeStyle = color;
    setTool("draw");
  };

  const cursorToText = () => {
    document.body.style.cursor = "text";
    setTool("text");
  };

  const cursorToEraser = () => {
    document.body.style.cursor = "not-allowed";
    setTool("eraser");
  };

  const handleMouseDown = (event) => {
    if (tool === "draw"){
      setDrawing(true);
      setMouseState("down");

      const { clientX, clientY } = event;
      contextRef.current.beginPath();
      contextRef.current.moveTo(clientX-32, clientY);
      contextRef.current.lineWidth = 3;
      const elem = { x: clientX - 32, y: clientY, tool: tool, mouseState: mouseState, currentColor: currentColor };
      socket.emit("sendElement", elem);
    } else if (tool === "text"){
      const textInput = prompt("Enter your text: ", "");
      if(textInput){
        const { clientX, clientY } = event;
        contextRef.current.fillText(textInput, clientX-32, clientY);
        const sendText = { textInput: textInput, x: clientX-32, y: clientY };
        socket.emit("sendText", sendText);
      }
    } else if (tool === "eraser"){
      setErasing(true);
      setMouseState("down");

      const { clientX, clientY } = event;
      contextRef.current.strokeStyle = "white";
      contextRef.current.beginPath();
      contextRef.current.moveTo(clientX-32, clientY);
      contextRef.current.lineWidth = 10;
      const elem = { x: clientX - 32, y: clientY, tool: tool, mouseState: mouseState };
      socket.emit("sendElement", elem);
    }
  };

  const handleMouseMove = (event) => {
    if (tool === "draw"){
      if(!drawing) return;

      setMouseState("move");
      const { clientX, clientY } = event;
      contextRef.current.lineTo(clientX-32, clientY);
      contextRef.current.stroke();
      const elem = { x: clientX - 32, y: clientY, tool: tool, mouseState: mouseState, currentColor: currentColor };
      socket.emit("sendElement", elem);
    } else if (tool === "eraser"){
      if(!erasing) return;

      setMouseState("move");
      const { clientX, clientY } = event;
      contextRef.current.lineTo(clientX-32, clientY);
      contextRef.current.stroke();
      const elem = { x: clientX - 32, y: clientY, tool: tool, mouseState: mouseState };
      socket.emit("sendElement", elem);
    }
  };

  const handleMouseUp = () => {
    if (tool === "draw"){
      setMouseState("up");
      contextRef.current.closePath();
      setDrawing(false);
      const elem = { tool: tool, mouseState: mouseState };
      socket.emit("sendElement", elem);
    } else if (tool === "eraser"){
      setMouseState("up");
      contextRef.current.closePath();
      setErasing(false);
      const elem = { tool: tool, mouseState: mouseState };
      socket.emit("sendElement", elem);
    }
  };

  return (
    <div className="App">
      <div className="toolBar">
        <button onClick={cursorToDefault}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cursor" viewBox="0 0 16 16">
            <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52 2.25 8.184z"/>
          </svg>
        </button>
        <button id="black" onClick={cursorToDraw}>
          <div id="black" className="blackButton" />
        </button>
        <button id="yellow" onClick={cursorToDraw}>
          <div id="yellow" className="yellowButton" />
        </button>
        <button id="red" onClick={cursorToDraw}>
          <div id="red" className="redButton" />
        </button>
        <button id="blue" onClick={cursorToDraw}>
          <div id="blue" className="blueButton" />
        </button>
        <button id="green" onClick={cursorToDraw}>
          <div id="green" className="greenButton" />
        </button>
        <button id="purple" onClick={cursorToDraw}>
          <div id="purple" className="purpleButton" />
        </button>
        <button onClick={cursorToText}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fonts" viewBox="0 0 16 16">
            <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479L12.258 3z"/>
          </svg>
        </button>
        <button onClick={cursorToEraser}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eraser" viewBox="0 0 16 16">
            <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>
          </svg>
        </button>
      </div>
        <canvas 
        id="canvas" 
        style={{backgroundColor: 'white'}} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={canvasRef}
        />
      </div>
  );
}

export default App;
