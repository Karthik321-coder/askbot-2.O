document.getElementById('payBtn').onclick = async () => {
  const order = await fetch('/api/order', {method:'POST',body:JSON.stringify({amount:4900})})
                      .then(r=>r.json());

  const rzp = new Razorpay({
     key:  RAZOR_KEY,                       // inject via <script> or env
     order_id: order.id,
     amount:   order.amount,
     currency: 'INR',
     name: 'AskBot',
     description: '24-hour pass',
     theme:{color:'#5A31F4'},
     handler: async resp=>{
        await fetch('/api/verify',{method:'POST',body:JSON.stringify(resp)});
        location.replace('/payments/success.html');
     }
  });
  rzp.open();
};
