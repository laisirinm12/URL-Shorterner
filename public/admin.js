let globalData = {};
let chart;

const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const sortClicks = document.getElementById("sortClicks");
const loading = document.getElementById("loadingSpinner");

const BASE_URL = ""; // same-origin

/* ---------- LOAD DATA ---------- */

async function loadData(){

if(loading) loading.style.display = "block";

const res = await fetch(`${BASE_URL}/admin`);
const data = await res.json();

globalData = data;

const search = searchInput.value.toLowerCase();

let filtered = data;

if(search){

filtered = {};

for(const code in globalData){

if(code.toLowerCase().includes(search)){
filtered[code] = globalData[code];
}

}

}

renderTable(filtered);
renderChart(filtered);
updateStats(filtered);

if(loading) loading.style.display = "none";

}

/* ---------- TABLE ---------- */

function renderTable(data){

tableBody.innerHTML = "";

const codes = Object.keys(data);

if(codes.length === 0){

tableBody.innerHTML = `
<tr>
<td colspan="5" style="text-align:center;padding:20px;color:#777;">
No results found
</td>
</tr>
`;

return;
}

for(const code in data){

let expiry;

if(!data[code].expiresAt){
expiry = "Never";
}
else if(Date.now() > data[code].expiresAt){
expiry = "Expired";
}
else{
expiry = Math.ceil((data[code].expiresAt - Date.now())/(1000*60*60*24)) + " days";
}

const row = document.createElement("tr");

row.innerHTML = `
<td>${code}</td>
<td>${data[code].url}</td>
<td>${data[code].clicks}</td>
<td>${expiry}</td>
<td><button data-code="${code}">Delete</button></td>
`;

row.querySelector("button").addEventListener("click", () => deleteLink(code));

tableBody.appendChild(row);

}

}

/* ---------- DELETE ---------- */

async function deleteLink(code){

// ✅ CONFIRMATION ALERT
const confirmDelete = confirm("Are you sure you want to delete this link?");

if(!confirmDelete){
return; // stop if user cancels
}

await fetch(`/delete/${code}`,{
method:"DELETE"
});

loadData();

}

/* ---------- SEARCH ---------- */

searchInput.addEventListener("keyup", () => {

const search = searchInput.value.toLowerCase();

const filtered = {};

for(const code in globalData){

if(code.toLowerCase().includes(search)){
filtered[code] = globalData[code];
}

}

renderTable(filtered);
renderChart(filtered);
updateStats(filtered);

});

/* ---------- SORT ---------- */

sortClicks.addEventListener("click", () => {

const sorted = Object.entries(globalData)
.sort((a,b)=>b[1].clicks - a[1].clicks);

const sortedObj = Object.fromEntries(sorted);

renderTable(sortedObj);

});

/* ---------- CHART ---------- */

function renderChart(data){

const codes = Object.keys(data);
const clicks = codes.map(code => data[code].clicks);

const ctx = document.getElementById("clickChart").getContext("2d");

if(chart){
chart.destroy();
}

chart = new Chart(ctx,{

type: "bar",

data: {
labels: codes,

datasets: [{
label: "Clicks",
data: clicks,
backgroundColor:"#4f46e5"
}]
},

options:{
responsive:true,

plugins:{
legend:{
display:false
}
},

scales:{
x:{
grid:{
display:false
}
},
y:{
grid:{
display:false
},
ticks:{
stepSize:1
}
}
}

}

});

}

/* ---------- STATS ---------- */

function updateStats(data){

const codes = Object.keys(data);

const totalLinks = codes.length;

let totalClicks = 0;
let activeLinks = 0;

codes.forEach(code => {

totalClicks += data[code].clicks;

if(!data[code].expiresAt || Date.now() < data[code].expiresAt){
activeLinks++;
}

});

document.getElementById("totalLinks").innerText = totalLinks;
document.getElementById("totalClicks").innerText = totalClicks;
document.getElementById("activeLinks").innerText = activeLinks;

}

/* ---------- INITIAL LOAD ---------- */

loadData();

setInterval(loadData,3000);