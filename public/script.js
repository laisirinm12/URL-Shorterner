async function shorten() {

  try {

    const url = document.getElementById("urlInput").value;
    const customCode = document.getElementById("customCode").value;
    const expiryDays = document.getElementById("expiryDays").value;

    const res = await fetch("/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, customCode, expiryDays })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("result").textContent = data.error;
      return;
    }

    const shortUrl = data.shortUrl;
document.getElementById("result").innerHTML =
`Short URL: 
<a href="${shortUrl}" target="_blank">${shortUrl}</a>
<button id="copyBtn" class="copy-btn" onclick="copyLink('${shortUrl}')">
Copy
</button>`;

    document.getElementById("qrCode").src =
      `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${shortUrl}`;

  } catch (error) {
    document.getElementById("result").textContent = error.message;
  }

}

function copyLink(url){

const result = document.getElementById("result");

if(!url || result.innerText.trim() === ""){
result.innerText = "Nothing to copy";
return;
}

navigator.clipboard.writeText(url);

const btn = document.getElementById("copyBtn");

if(!btn) return;

btn.textContent = "Copied ✓";
btn.style.backgroundColor = "#10b981";
btn.style.color = "white";

setTimeout(()=>{
btn.textContent = "Copy";
btn.style.backgroundColor = "#4f46e5";
btn.style.color = "white";
},2000);

}


function clearFields(){

const url = document.getElementById("urlInput").value;
const code = document.getElementById("customCode").value;
const expiry = document.getElementById("expiryDays").value;

if(!url && !code && !expiry){

document.getElementById("result").innerText = "Nothing to clear";
return;

}

document.getElementById("urlInput").value = "";
document.getElementById("customCode").value = "";
document.getElementById("expiryDays").value = "";

document.getElementById("result").innerHTML = "";
document.getElementById("qrCode").src = "";

}