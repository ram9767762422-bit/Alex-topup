const products = [
  {id:1, name:"25 Diamonds", price:35, cat:"Diamonds"}, {id:2, name:"50 Diamonds", price:65, cat:"Diamonds"},
  {id:3, name:"115 Diamonds", price:110, cat:"Diamonds"}, {id:4, name:"240 Diamonds", price:220, cat:"Diamonds"},
  {id:5, name:"355 Diamonds", price:330, cat:"Diamonds"}, {id:6, name:"480 Diamonds", price:440, cat:"Diamonds"},
  {id:7, name:"610 Diamonds", price:550, cat:"Diamonds"}, {id:8, name:"725 Diamonds", price:655, cat:"Diamonds"},
  {id:9, name:"850 Diamonds", price:725, cat:"Diamonds"}, {id:10, name:"965 Diamonds", price:885, cat:"Diamonds"},
  {id:11, name:"1090 Diamonds", price:990, cat:"Diamonds"}, {id:12, name:"1240 Diamonds", price:1065, cat:"Diamonds"},
  {id:13, name:"Weekly Membership", price:210, cat:"Membership"}, {id:14, name:"Monthly Membership", price:1050, cat:"Membership"},
  {id:15, name:"Weekly + Monthly Combo", price:1260, cat:"Membership"}, {id:16, name:"Airdrop", price:175, cat:"Special"},
  {id:17, name:"Less Is More", price:230, cat:"Special"}, {id:18, name:"Level Up Pass - Level 6", price:80, cat:"Level Up Pass"},
  {id:19, name:"Level Up Pass - Level 10", price:120, cat:"Level Up Pass"}, {id:20, name:"Level Up Pass - Level 15", price:120, cat:"Level Up Pass"},
  {id:21, name:"Level Up Pass - Level 20", price:120, cat:"Level Up Pass"}, {id:22, name:"Level Up Pass - Level 25", price:120, cat:"Level Up Pass"},
  {id:23, name:"Level Up Pass - Level 30", price:180, cat:"Level Up Pass"}, {id:24, name:"Full Level Up (Around)", price:630, cat:"Level Up Pass"}
];
const WA="9779828821325";
const FF_API_BASE="https://api2.nftoken.info";
let selectedProduct=null, orderStep=1, selectedPayment="", verified=false;
const money=n=>`Rs. ${Number(n).toLocaleString("en-NP")}`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
function toggleMenu(){document.getElementById("nav").classList.toggle("open")}
function moneyText(n){return money(n)}
function renderProducts(filter="All", search=""){
  const grid=document.getElementById("productGrid"); if(!grid)return;
  const q=search.trim().toLowerCase();
  const list=products.filter(p=>(filter==="All"||p.cat===filter)&&(!q||p.name.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q)));
  grid.innerHTML=list.length?list.map(p=>`<article class="product"><small>${esc(p.cat)}</small><b>${esc(p.name)}</b><div class="price">${money(p.price)}</div><button class="btn primary buy" onclick="openOrder(${p.id})">Select</button></article>`).join(""):"<div class='empty-state'>No package found. Try another search.</div>";
}
function filterProducts(cat){document.querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat));renderProducts(cat,document.getElementById("productSearch")?.value||"")}
function openOrder(id){
  if(!localStorage.getItem("alexUser")){document.getElementById("loginMsg").textContent="Please login first, then select your package.";location.hash="account";return;}
  selectedProduct=products.find(p=>p.id===id); orderStep=1; selectedPayment=""; verified=false;
  document.getElementById("modal").classList.remove("hidden"); document.getElementById("modalProduct").textContent=selectedProduct.name;
  document.getElementById("modalPrice").textContent=money(selectedProduct.price); document.getElementById("orderUID").value="";
  document.getElementById("orderName").textContent=""; renderOrderStep();
}
function renderOrderStep(){
  const step=document.getElementById("orderStep"), next=document.getElementById("orderNext"), uid=document.getElementById("orderUID"), verify=document.getElementById("verifyBtn"), payment=document.getElementById("paymentChoices"), summary=document.getElementById("paymentSummary");
  document.getElementById("stepLabel").textContent=`STEP ${orderStep} OF 3`;
  uid.classList.toggle("hidden",orderStep!==2); verify.classList.toggle("hidden",orderStep!==2); payment.classList.toggle("hidden",orderStep!==3); summary.classList.toggle("hidden",orderStep!==3);
  if(orderStep===1){step.textContent="Confirm your selected package.";next.textContent="Next: Enter UID"}
  if(orderStep===2){step.textContent="Enter your Free Fire UID. We will automatically check the player name.";next.textContent="Next: Payment Method"}
  if(orderStep===3){step.textContent="Choose eSewa, Khalti, MyPay or Fonepay.";next.textContent="Create Order";summary.innerHTML=`<b>${selectedPayment||"Select a payment method"}</b><br>${money(selectedProduct.price)} • UID: ${esc(uid.value.trim())}`}
}
async function verifyUID(){
  const uid=document.getElementById("orderUID").value.trim(), box=document.getElementById("orderName"), btn=document.getElementById("verifyBtn");
  if(!/^\d{6,15}$/.test(uid)){box.textContent="Enter a valid numeric Player UID (6–15 digits).";verified=false;return false}
  btn.disabled=true; btn.textContent="Checking…"; box.textContent="Checking player name…"; verified=false;
  try{
    const res=await fetch(`${FF_API_BASE}/player-info?uid=${encodeURIComponent(uid)}`,{headers:{"Accept":"application/json"}});
    const data=await res.json().catch(()=>({}));
    const name=data?.AccountInfo?.AccountName || data?.basicInfo?.nickname || data?.basicinfo?.nickname || data?.nickname || data?.name;
    const region=data?.AccountInfo?.AccountRegion || data?.basicInfo?.region || data?.basicinfo?.region || data?.region;
    if(!res.ok || !name) throw new Error(data?.error||"Player not found");
    verified=true;
    box.innerHTML=`✓ Player found: <b>${esc(name)}</b>${region?` <small>(${esc(region)})</small>`:""}`;
    return true;
  }catch(err){
    box.textContent=`Could not verify this UID automatically. ${err?.message||"Please try again."}`;
    verified=false; return false;
  }finally{btn.disabled=false;btn.textContent="Check Player Name"}
}
async function nextOrderStep(){if(orderStep===2&&!await verifyUID())return;if(orderStep===3){createOrder();return}orderStep++;renderOrderStep()}
function selectPayment(name){selectedPayment=name;document.querySelectorAll(".payment-choice").forEach(x=>x.classList.toggle("active",x.dataset.pay===name));renderOrderStep()}
function createOrder(){
  const uid=document.getElementById("orderUID").value.trim(); if(!selectedPayment){alert("Please select a payment method.");return}
  const orders=JSON.parse(localStorage.getItem("alexOrders")||"[]"), id="AX"+Date.now().toString().slice(-7);
  orders.unshift({id,product:selectedProduct.name,price:selectedProduct.price,uid,payment:selectedPayment,status:"Pending",time:new Date().toLocaleString("en-NP")}); localStorage.setItem("alexOrders",JSON.stringify(orders));
  closeModal();renderOrders();location.hash="payment";
  const msg=`ALEX TOPUP Order\nOrder ID: ${id}\nProduct: ${selectedProduct.name}\nUID: ${uid}\nAmount: ${money(selectedProduct.price)}\nPayment: ${selectedPayment}`;
  document.getElementById("waOrderLink").href=`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  alert(`Order ${id} created. Complete payment and send the receipt with your UID/order ID on WhatsApp.`);
}
function renderOrders(){
  const box=document.getElementById("orderList");if(!box)return;const orders=JSON.parse(localStorage.getItem("alexOrders")||"[]");
  if(!orders.length){box.innerHTML='<div class="order empty-state">No orders yet.</div>';return}
  box.innerHTML=orders.slice(0,12).map(o=>`<div class="order"><strong>${esc(o.id)}</strong> • ${esc(o.product)}<br>UID: ${esc(o.uid)} • ${money(o.price)} • ${esc(o.payment||"—")} <em>${esc(o.status)}</em><br><small>${esc(o.time)}</small><button class="copy-btn" onclick="copyText('${esc(o.id)}')">Copy ID</button></div>`).join("");
}
async function copyText(text){try{await navigator.clipboard.writeText(text);alert("Copied: "+text)}catch(e){prompt("Copy this order ID:",text)}}
function demoLogin(){const email=document.getElementById("email").value.trim(),pass=document.getElementById("password").value,msg=document.getElementById("loginMsg");if(!email||!pass){msg.textContent="Enter email/username and password.";return}localStorage.setItem("alexUser",email);document.getElementById("accountTitle").textContent="Welcome, "+email;msg.textContent="✓ Demo login active on this browser. Secure accounts need a backend.";}
function demoRegister(){document.getElementById("loginMsg").textContent="Demo registration: enter any email/username and password to continue. This does not create a real server account."}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function logout(){localStorage.removeItem("alexUser");location.reload()}
function init(){
  renderProducts();renderOrders();
  const u=localStorage.getItem("alexUser");if(u){document.getElementById("accountTitle").textContent="Welcome, "+u;document.getElementById("loginMsg").textContent="✓ Demo session active on this browser."}
  document.getElementById("productSearch")?.addEventListener("input",e=>{const active=document.querySelector(".filter-btn.active")?.dataset.cat||"All";renderProducts(active,e.target.value)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
}
init();
