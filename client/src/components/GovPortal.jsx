import { useState } from 'react';

export default function GovPortal({ scheme, onClose, toast }) {
  const [step, setStep] = useState(1);
  const [appId] = useState('KS/' + new Date().getFullYear() + '/' + Math.floor(100000+Math.random()*900000));
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({fname:'',lname:'',mobile:'',state:'',district:'',area:'',crop:'',bank:'',accno:'',ifsc:'',aadhaar:''});
  const u = (k,v) => setForm({...form,[k]:v});

  const sendOTP = () => {
    if (form.aadhaar.replace(/\s/g,'').length !== 12) { toast('⚠️ Enter valid 12-digit Aadhaar'); return; }
    setOtpSent(true);
    setTimeout(() => { setOtpVerified(true); toast('Aadhaar Verified ✅'); }, 2500);
  };

  const finalSubmit = () => {
    if (!declared) { toast('⚠️ Please accept the declaration'); return; }
    setSubmitted(true);
    toast('Application '+appId+' submitted! 🎉');
  };

  if (!scheme) return null;

  return (
    <div className="gov-overlay open" id="gov-overlay">
      <div className="gov-portal">
        <div className="gov-portal-header">
          <h2 id="gov-portal-title">📋 {scheme.name} – Application</h2>
          <p id="gov-portal-subtitle">{scheme.benefit} | {scheme.elig}</p>
          <p id="gov-app-id" style={{fontSize:'.78rem',marginTop:'.3rem'}}>Application ID: {appId}</p>
          <button className="gov-close" onClick={onClose}>✕</button>
        </div>

        {/* Step Indicator */}
        <div className="gov-steps">
          {['Personal','Land','Bank','Aadhaar','Documents','Review'].map((s,i)=>{
            const n=i+1;
            return (
              <span key={n} style={{display:'contents'}}>
                <div className={`gov-step-item${n===step?' active':''}${n<step?' done':''}`}>
                  <div className="gs-num">{n<step?'✓':n}</div>
                  <span>{s}</span>
                </div>
                {i<5&&<div className={`gov-step-line${n<step?' done':''}`}></div>}
              </span>
            );
          })}
        </div>

        {!submitted ? (
          <div className="gov-body">
            {/* Step 1: Personal */}
            {step===1 && (
              <div className="gov-section active">
                <h3>👤 Personal Information</h3>
                <div className="form-row">
                  <div className="form-group"><label>First Name</label><input value={form.fname} onChange={e=>u('fname',e.target.value)} placeholder="Ramesh" type="text"/></div>
                  <div className="form-group"><label>Last Name</label><input value={form.lname} onChange={e=>u('lname',e.target.value)} placeholder="Patel" type="text"/></div>
                </div>
                <div className="form-group"><label>Mobile Number</label><input value={form.mobile} onChange={e=>u('mobile',e.target.value)} maxLength="10" placeholder="10-digit" type="tel"/></div>
                <button className="btn btn-primary" onClick={()=>setStep(2)} style={{width:'100%'}}>Next: Land Details →</button>
              </div>
            )}
            {/* Step 2: Land */}
            {step===2 && (
              <div className="gov-section active">
                <h3>🌾 Land & Crop Details</h3>
                <div className="form-row">
                  <div className="form-group"><label>State</label><input value={form.state} onChange={e=>u('state',e.target.value)} placeholder="Maharashtra" type="text"/></div>
                  <div className="form-group"><label>District</label><input value={form.district} onChange={e=>u('district',e.target.value)} placeholder="Nashik" type="text"/></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Land Area (Acres)</label><input value={form.area} onChange={e=>u('area',e.target.value)} placeholder="5.5" type="number"/></div>
                  <div className="form-group"><label>Primary Crop</label><input value={form.crop} onChange={e=>u('crop',e.target.value)} placeholder="Wheat" type="text"/></div>
                </div>
                <div style={{display:'flex',gap:'1rem'}}><button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button><button className="btn btn-primary" onClick={()=>setStep(3)} style={{flex:1}}>Next: Bank Details →</button></div>
              </div>
            )}
            {/* Step 3: Bank */}
            {step===3 && (
              <div className="gov-section active">
                <h3>🏦 Bank Account Details</h3>
                <div className="form-group"><label>Bank Name</label><input value={form.bank} onChange={e=>u('bank',e.target.value)} placeholder="State Bank of India" type="text"/></div>
                <div className="form-row">
                  <div className="form-group"><label>Account Number</label><input value={form.accno} onChange={e=>u('accno',e.target.value)} placeholder="XXXXXXXXXXXX" type="text"/></div>
                  <div className="form-group"><label>IFSC Code</label><input value={form.ifsc} onChange={e=>u('ifsc',e.target.value)} placeholder="SBIN0012345" type="text"/></div>
                </div>
                <div style={{display:'flex',gap:'1rem'}}><button className="btn btn-outline" onClick={()=>setStep(2)}>← Back</button><button className="btn btn-primary" onClick={()=>setStep(4)} style={{flex:1}}>Next: Aadhaar Verification →</button></div>
              </div>
            )}
            {/* Step 4: Aadhaar */}
            {step===4 && (
              <div className="gov-section active">
                <h3>🪪 Aadhaar Verification</h3>
                <div className="form-group"><label>Aadhaar Number</label><input value={form.aadhaar} onChange={e=>u('aadhaar',e.target.value)} maxLength="14" placeholder="XXXX XXXX XXXX" type="text"/></div>
                <button className="btn btn-green" onClick={sendOTP} style={{width:'100%',marginBottom:'1rem'}}>{otpSent?'Resend OTP':'Send OTP'}</button>
                {otpSent && !otpVerified && <div style={{display:'flex',alignItems:'center',gap:'.5rem',color:'#FF9800'}}>⏳ Verifying...</div>}
                {otpVerified && <div style={{display:'flex',alignItems:'center',gap:'.5rem',color:'#2E7D32',fontWeight:700}}>🔒 Aadhaar Verified Successfully!</div>}
                <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}><button className="btn btn-outline" onClick={()=>setStep(3)}>← Back</button><button className="btn btn-primary" onClick={()=>setStep(5)} style={{flex:1}}>Next: Documents →</button></div>
              </div>
            )}
            {/* Step 5: Documents */}
            {step===5 && (
              <div className="gov-section active">
                <h3>📎 Upload Documents</h3>
                {(scheme.docs||['Aadhaar','Land Record','Bank Passbook']).map((d,i)=>(
                  <div key={i} className="doc-upload-zone" onClick={()=>toast(d+' uploaded ✅')} style={{cursor:'pointer'}}>
                    <div className="doc-icon">📄</div>
                    <p>{d}</p>
                    <span style={{fontSize:'.75rem',color:'var(--text3)'}}>Click to upload (Simulated)</span>
                  </div>
                ))}
                <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}><button className="btn btn-outline" onClick={()=>setStep(4)}>← Back</button><button className="btn btn-primary" onClick={()=>setStep(6)} style={{flex:1}}>Next: Review →</button></div>
              </div>
            )}
            {/* Step 6: Review */}
            {step===6 && (
              <div className="gov-section active">
                <h3>📋 Review & Submit</h3>
                <div className="review-card">
                  {[['Scheme',scheme.name],['App ID',appId],['Name',`${form.fname} ${form.lname}`],['Mobile',form.mobile],['State/District',`${form.state}/${form.district}`],['Land',form.area?form.area+' Acres':'—'],['Crop',form.crop],['Bank',form.bank],['Aadhaar',otpVerified?'🔒 Verified':'❌ Not verified']].map(([k,v],i)=>(
                    <div key={i} className="review-row"><span className="rv-key">{k}</span><span className="rv-val">{v||'—'}</span></div>
                  ))}
                </div>
                <label style={{display:'flex',gap:'.5rem',alignItems:'center',margin:'1rem 0',fontSize:'.88rem'}}>
                  <input type="checkbox" checked={declared} onChange={e=>setDeclared(e.target.checked)}/>
                  I declare all information is correct and I agree to terms.
                </label>
                <div style={{display:'flex',gap:'1rem'}}><button className="btn btn-outline" onClick={()=>setStep(5)}>← Back</button><button className="btn btn-primary" onClick={finalSubmit} style={{flex:1}}>✅ Submit Application</button></div>
              </div>
            )}
          </div>
        ) : (
          <div className="gov-body" style={{textAlign:'center',padding:'3rem'}}>
            <div style={{fontSize:'4rem'}}>🎉</div>
            <h2 style={{color:'var(--primary)',marginTop:'1rem'}}>Application Submitted!</h2>
            <p style={{fontSize:'1.1rem',margin:'1rem 0'}}>Application ID: <b style={{color:'var(--primary)'}}>{appId}</b></p>
            <p>You will receive SMS updates on your registered mobile number.</p>
            <button className="btn btn-primary" onClick={onClose} style={{marginTop:'1.5rem'}}>✅ Close Portal</button>
          </div>
        )}
      </div>
    </div>
  );
}
