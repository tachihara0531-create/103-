let chart;

document.getElementById("calculateBtn").addEventListener("click", calculate);

function calculate() {
  const wage = Number(document.getElementById("wage").value);
  const hours = Number(document.getElementById("hours").value);
  const days = Number(document.getElementById("days").value);
  const springHours = Number(document.getElementById("springHours").value) || hours;
  const springDays = Number(document.getElementById("springDays").value) || days;
  const summerHours = Number(document.getElementById("summerHours").value) || hours;
  const summerDays = Number(document.getElementById("summerDays").value) || days;

  if (!wage || !hours || !days) {
    alert("まず基本シフトを入力してください");
    return;
  }

  const monthlyIncome = [];
  const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

  for (let m=1; m<=12; m++) {
    let h = hours, d = days;
    if (m===2||m===3) { h=springHours; d=springDays; }
    if (m===8||m===9) { h=summerHours; d=summerDays; }
    monthlyIncome.push(h*d*4*wage);
  }

  const yearly = monthlyIncome.reduce((a,b)=>a+b,0);
  document.getElementById("income").textContent = `年収: ${yearly.toLocaleString()}円`;

  // 計算過程表示
  let processText = "";
  monthlyIncome.forEach((mInc, i)=>{
    processText += `${monthNames[i]}: ${mInc.toLocaleString()}円<br>`;
  });
  document.getElementById("process").innerHTML = processText;

  // 壁判定
  let resultMsg="", remaining=0;
  if(yearly<=1030000){ resultMsg="🟢 103万以下"; remaining=1030000-yearly;}
  else if(yearly<=1060000){ resultMsg="🟡 106万ゾーン"; remaining=1060000-yearly;}
  else if(yearly<=1300000){ resultMsg="🟠 130万ゾーン"; remaining=1300000-yearly;}
  else{ resultMsg="🔴 130万超え"; remaining=0;}
  const resEl = document.getElementById("result");
  resEl.textContent=resultMsg;
  resEl.className = resultMsg.includes("🟢") ? "safe" : resultMsg.includes("🟡")||resultMsg.includes("🟠") ? "warn" : "danger";
  document.getElementById("remaining").textContent = remaining>0?`あと ${remaining.toLocaleString()}円`: "";

  // 逆算シフト・アドバイス
  const adviceEl = document.getElementById("advice");
  const yearlyHours = 1030000 / wage; 
  const currentWeeklyHours = hours*days;
  const remainingWeeklyHours = yearlyHours/52 - currentWeeklyHours;
  const possibleDays = yearlyHours/52 / hours;
  let advice="";
  if(remainingWeeklyHours>0) advice += `👉 あと ${remainingWeeklyHours.toFixed(1)}時間/週働けます<br>`;
  else advice += "⚠️ 超過しています<br>";
  advice += `👉 週${possibleDays.toFixed(1)}日まで働けます<br>`;
  advice += `💡 おすすめ: 週${Math.floor(possibleDays)}日勤務`;
  adviceEl.innerHTML = advice;

  // 月別グラフ（壁ライン表示）
  const ctx=document.getElementById("chart");
  if(chart){ chart.destroy(); }
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthNames,
      datasets: [
        { 
          label: "月収", 
          data: monthlyIncome,
          backgroundColor: monthlyIncome.map(v=>{
            const annual = v*12;
            if(annual<=1030000) return "green";
            else if(annual<=1060000) return "orange";
            else if(annual<=1300000) return "red";
            else return "darkred";
          })
        },
        { label:"103万ライン", data:Array(12).fill(1030000/12), type:"line", borderColor:"green", borderWidth:2, fill:false, tension:0.1 },
        { label:"106万ライン", data:Array(12).fill(1060000/12), type:"line", borderColor:"orange", borderWidth:2, fill:false, tension:0.1 },
        { label:"130万ライン", data:Array(12).fill(1300000/12), type:"line", borderColor:"red", borderWidth:2, fill:false, tension:0.1 }
      ]
    },
    options: { responsive:true }
  });

  // カレンダー生成
  generateCalendar(hours, days, springHours, springDays, summerHours, summerDays);

  // 保存 localStorage
  const saveData = { wage, hours, days, springHours, springDays, summerHours, summerDays };
  localStorage.setItem("shiftData", JSON.stringify(saveData));
}

// ページ読み込み時に復元
window.addEventListener("load", ()=>{
  const data = JSON.parse(localStorage.getItem("shiftData"));
  if(data){
    Object.keys(data).forEach(k=>{
      document.getElementById(k).value = data[k];
    });
  }
});

// 週・日カレンダー生成
function generateCalendar(basicHours, basicDays, springHours, springDays, summerHours, summerDays){
  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = "";
  const monthWeeks = 4;
  const weekDays = 7;

  for(let week=0; week<monthWeeks; week++){
    for(let day=0; day<weekDays; day++){
      let h = basicHours;
      let d = basicDays;
      // 簡易 春:2月, 夏:8月
      if(week<1) { h=springHours; d=springDays; }
      if(week>=2 && week<3) { h=summerHours; d=summerDays; }

      const dailyHours = day<d ? h : 0;

      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";
      if(dailyHours*4*12<=1030000) dayEl.classList.add("safe-day");
      else if(dailyHours*4*12<=1060000) dayEl.classList.add("warn-day");
      else dayEl.classList.add("danger-day");

      dayEl.innerHTML = `週${week+1}日${day+1}<br>${dailyHours}h`;
      calendarEl.appendChild(dayEl);
    }
  }
}