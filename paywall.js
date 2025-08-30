/* -- global helpers ----------------------------------- */
const RAZOR_KEY = 'rzp_live_xxxxx';          // inject at build OR read via HTML data-
/* 1️⃣ Redirect unpaid users trying to reach paid-chat.html */
if (location.pathname.endsWith('paid-chat.html') &&
    !document.cookie.includes('paid=true')){
  location.replace('pay.html');
}

/* 2️⃣ Handle checkout on pay.html */
async function openCheckout(){
  const order = await fetch('/api/create-order',{
      method:'POST',
      body:JSON.stringify({amount:4900})    // paise
  }).then(r=>r.json());

  const rzp = new window.Razorpay({
     key: RAZOR_KEY,
     order_id: order.id,
     amount: order.amount,
     currency:'INR',
     theme:{color:'#5A31F4'},
     name:'AskBot',
     description:'24-hour pass',
     handler: async resp=>{
        await fetch('/api/verify',{method:'POST',body:JSON.stringify(resp)});
        location.replace('paid-chat.html');
     }
  });
  rzp.open();
}
if(document.getElementById('payBtn')) document.getElementById('payBtn').onclick = openCheckout;
