import React, { useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { sfx } from "./sfx.js";

const ItemTypes = { MINERAL: "MINERAL" };

function Draggable({ item, disabled }){
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.MINERAL,
    item,
    canDrag: !disabled,
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [disabled]);

  return (
    <div
      ref={drag}
      className="dragItem"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "grab"
      }}
      onMouseDown={()=>sfx.click()}
      title="اسحب"
    >
      🧩 {item.label}
    </div>
  );
}

function DropZone({ zone, onDrop, filledItem }){
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.MINERAL,
    drop: (item) => onDrop(zone, item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [zone, onDrop]);

  const active = canDrop && isOver;

  return (
    <div ref={drop} className={"dropZone " + (active ? "active" : "")}>
      <div className="dropTitle">🧭 {zone.title}</div>
      <div className="dropHint">{zone.hint}</div>
      <div className="dropSlot">
        {filledItem ? <span className="dropFilled">✅ {filledItem.label}</span> : <span className="dropEmpty">اسحب العنصر هنا</span>}
      </div>
    </div>
  );
}

export default function DragDropMinerals({ onAward }){
  const zones = useMemo(() => ([
    { id:"gold_sukari", title:"منجم السكري", hint:"فين مكان استخراج الذهب؟" },
    { id:"phosphate_abu_tartur", title:"أبو طرطور", hint:"فين مكان الفوسفات؟" },
    { id:"iron_bahariya", title:"الواحات البحرية", hint:"فين مكان الحديد؟" },
  ]), []);

  const items = useMemo(() => ([
    { id:"gold_sukari", label:"الذهب" },
    { id:"phosphate_abu_tartur", label:"الفوسفات" },
    { id:"iron_bahariya", label:"الحديد" },
  ]), []);

  const [placed, setPlaced] = useState({}); // zoneId -> item
  const [result, setResult] = useState(null);

  function handleDrop(zone, item){
    // place item in zone
    setPlaced(prev => ({ ...prev, [zone.id]: item }));
    sfx.click();
  }

  function check(){
    let correct = 0;
    for(const z of zones){
      if(placed[z.id]?.id === z.id) correct++;
    }
    const all = correct === zones.length;
    setResult({ correct, total: zones.length, all });
    if(all){
      onAward?.(20); // big reward
      sfx.reward();
    }else if(correct > 0){
      onAward?.(5);
      sfx.correct();
    }else{
      sfx.wrong();
    }
  }

  function reset(){
    setPlaced({});
    setResult(null);
    sfx.click();
  }

  return (
    <div className="card">
      <div className="row">
        <b>لعبة المطابقة: المعدن والمكان</b>
        <span className="small">ركّب كل معدن في موقعه الصحيح</span>
      </div>
      <div className="hr" />

      <DndProvider backend={HTML5Backend}>
        <div className="ddGrid">
          <div>
            <div className="small" style={{marginBottom:8}}>المعادن</div>
            <div className="dragList">
              {items.map(it => (
                <Draggable key={it.id} item={it} disabled={false} />
              ))}
            </div>
          </div>

          <div>
            <div className="small" style={{marginBottom:8}}>المواقع</div>
            <div className="dropList">
              {zones.map(z => (
                <DropZone key={z.id} zone={z} onDrop={handleDrop} filledItem={placed[z.id]} />
              ))}
            </div>
          </div>
        </div>
      </DndProvider>

      <div className="hr" />
      <div className="btnRow">
        <button className="btn" onClick={check}>تحقق</button>
        <button className="btn secondary" onClick={reset}>إعادة</button>
      </div>

      {result ? (
        <div className="notice" style={{marginTop:10, borderColor: result.all ? "rgba(22,163,74,.35)" : "rgba(124,58,237,.25)"}}>
          {result.all ? "ممتاز! كله صح. كسبت 20 نقطة!" : `صح ${result.correct} من ${result.total}. حاول تكمل!`}
        </div>
      ) : null}
    </div>
  );
}
