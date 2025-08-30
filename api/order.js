import Razorpay from 'razorpay';
export default async (req,res)=>{
  const {amount}=JSON.parse(req.body);
  const instance=new Razorpay({
    key_id:process.env.RAZOR_KEY_ID,
    key_secret:process.env.RAZOR_KEY_SECRET
  });
  const order=await instance.orders.create({amount,currency:'INR',payment_capture:1});
  res.status(200).json(order);
};
