import React from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function Item({ name }){
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ITEM",
    item: { name },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  }));

  return (
    <div ref={drag} className="kidBadge" style={{opacity:isDragging?0.5:1}}>
      {name}
    </div>
  );
}

function Target({ correct, onCorrect }){
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "ITEM",
    drop: (item) => {
      if(item.name === correct){
        onCorrect();
      }
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() })
  }));

  return (
    <div ref={drop} className="card" style={{border:isOver?"2px dashed green":""}}>
      اسحب العنصر إلى المكان الصحيح
    </div>
  );
}

export default function DragDropGame({ onWin }){
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="card">
        <b>لعبة بسيطة: اسحب الكلمة الصحيحة</b>
        <Item name="نهر النيل" />
        <Target correct="نهر النيل" onCorrect={onWin} />
      </div>
    </DndProvider>
  );
}
