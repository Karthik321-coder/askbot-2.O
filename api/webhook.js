import crypto from 'crypto';
export const config={api:{bodyParser:false}};
export default async (req,res)=>{
  const buf=await (await import('micro')).buffer(req);
  const sig=req.headers['x-razorpay-signature'];
  const valid=crypto.createHmac('sha256',process.env.RAZOR_KEY_SECRET)
                    .update(buf).digest('hex')===sig;
  if(valid) res.status(200).end(); else res.status(400).end();
};
