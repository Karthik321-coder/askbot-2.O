import crypto from 'crypto';
export default (req,res)=>{
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=JSON.parse(req.body);
  const expected=crypto.createHmac('sha256',process.env.RAZOR_KEY_SECRET)
                       .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if(expected===razorpay_signature){
      res.setHeader('Set-Cookie','paid=true; Path=/; Max-Age=86400; Secure; SameSite=Strict');
      return res.status(200).end();
  }
  res.status(400).end();
};
