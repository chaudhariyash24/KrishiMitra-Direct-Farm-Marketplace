import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

const STEPS = ['KYC Verification', 'OTP Verify', 'Documents', 'CIBIL Score', 'Apply Loan'];

function StepBar({ step }) {
  return (
    <div className="loan-steps-bar">
      {STEPS.map((s, i) => (
        <div key={i} className={`loan-step-item${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}>
          <div className="loan-step-num">{i < step ? '✓' : i + 1}</div>
          <span>{s}</span>
          {i < STEPS.length - 1 && <div className={`loan-step-line${i < step ? ' done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

function CibilGauge({ score, category }) {
  const [anim, setAnim] = useState(0);
  const [countVal, setCountVal] = useState(300);
  const ref = useRef();

  useEffect(() => {
    if (!score) return;
    const pct = (score - 300) / 600;
    let start = 0;
    const dur = 2000;
    const t0 = performance.now();
    const tick = (now) => {
      const elapsed = now - t0;
      const p = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnim(eased * pct);
      setCountVal(Math.round(300 + eased * (score - 300)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const angle = -90 + anim * 180;
  const r = 90, cx = 110, cy = 110;
  const startAngle = -180 * (Math.PI / 180);
  const endAngle = (angle - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;

  const getColor = (s) => s >= 750 ? '#4CAF50' : s >= 650 ? '#8BC34A' : s >= 550 ? '#FFC107' : '#F44336';

  return (
    <div className="cibil-gauge-wrap">
      <svg width="220" height="130" viewBox="0 0 220 130">
        <path d={`M 20 110 A 90 90 0 0 1 200 110`} fill="none" stroke="#e0e0e0" strokeWidth="18" strokeLinecap="round" />
        {anim > 0.001 && (
          <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none" stroke={getColor(countVal)} strokeWidth="18" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${getColor(countVal)}40)` }} />
        )}
        <text x="110" y="95" textAnchor="middle" fontSize="36" fontWeight="800" fill={getColor(countVal)} fontFamily="var(--font-head)">{countVal}</text>
        <text x="110" y="115" textAnchor="middle" fontSize="12" fontWeight="700" fill="#666">{category || ''}</text>
        <text x="24" y="125" textAnchor="middle" fontSize="10" fill="#999">300</text>
        <text x="196" y="125" textAnchor="middle" fontSize="10" fill="#999">900</text>
      </svg>
    </div>
  );
}

export default function Loans({ toast }) {
  const { currentFarmer } = useAuth();
  const [step, setStep] = useState(0);
  const [myLoans, setMyLoans] = useState([]);
  const [rate, setRate] = useState(7);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [kycResult, setKycResult] = useState(null);

  // Step 2
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpVerified, setOtpVerified] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Step 3
  const [docs, setDocs] = useState({ rationCard: null, incomeCert: null, landRecord: null, bankStatement: null });
  const [uploadedDocs, setUploadedDocs] = useState({});

  // Step 4
  const [cibil, setCibil] = useState(null);

  // Step 5
  const [loanAmt, setLoanAmt] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('Crop Production');
  const [loanDur, setLoanDur] = useState('24');
  const [emiResult, setEmiResult] = useState(null);

  useEffect(() => {
    API.get('/loans/rate').then(r => setRate(r.data.rate)).catch(() => {});
    if (currentFarmer?.id) {
      API.get(`/loans/farmer/${currentFarmer.id}`).then(r => setMyLoans(r.data)).catch(() => {});
    }
  }, [currentFarmer]);

  // OTP timer
  useEffect(() => {
    if (step !== 1 || otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [step, otpTimer]);

  // ── Step 1: Verify Aadhaar & PAN ──
  const verifyKYC = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/loans/verify-aadhaar', { aadhaar: aadhaar.replace(/\s/g, ''), pan });
      setKycResult(data);
      toast('✅ KYC verified! OTP sent.');
      setStep(1);
      setOtpTimer(30);
    } catch (e) {
      toast('❌ ' + (e.response?.data?.error || 'Verification failed'));
    } finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP ──
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    setLoading(true);
    try {
      await API.post('/loans/verify-otp', { otp: code });
      setOtpVerified(true);
      toast('✅ OTP verified!');
      setTimeout(() => setStep(2), 800);
    } catch (e) {
      toast('❌ ' + (e.response?.data?.error || 'OTP failed'));
    } finally { setLoading(false); }
  };

  // ── Step 3: Upload Documents ──
  const handleDocFile = (key, file) => {
    setDocs(prev => ({ ...prev, [key]: file }));
  };

  const uploadDocs = async () => {
    const fd = new FormData();
    Object.entries(docs).forEach(([k, f]) => { if (f) fd.append(k, f); });
    setLoading(true);
    try {
      const { data } = await API.post('/loans/upload-docs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadedDocs(data.documents);
      toast('✅ Documents uploaded!');
      setStep(3);
    } catch (e) {
      toast('❌ Upload failed');
    } finally { setLoading(false); }
  };

  // ── Step 4: Generate CIBIL ──
  const generateCibil = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/loans/generate-cibil');
      setCibil(data);
    } catch (e) {
      toast('❌ CIBIL generation failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (step === 3 && !cibil) generateCibil(); }, [step]);

  // ── Step 5: EMI Calc & Apply ──
  const calcEmi = () => {
    const amt = parseFloat(loanAmt) || 0;
    const dur = parseInt(loanDur) || 24;
    if (amt < 10000) { toast('⚠️ Minimum ₹10,000'); return; }
    const r = rate / 100 / 12;
    const emi = Math.round(amt * r * Math.pow(1 + r, dur) / (Math.pow(1 + r, dur) - 1));
    setEmiResult({ emi, total: emi * dur });
  };

  const applyLoan = async () => {
    const amt = parseFloat(loanAmt) || 0;
    const dur = parseInt(loanDur) || 24;
    const r2 = rate / 100 / 12;
    const emi = Math.round(amt * r2 * Math.pow(1 + r2, dur) / (Math.pow(1 + r2, dur) - 1));
    setLoading(true);
    try {
      const { data } = await API.post('/loans', {
        farmer: currentFarmer?.name || 'Unknown', farmerId: currentFarmer?.id,
        aadhaar: kycResult?.maskedAadhaar, pan: kycResult?.maskedPan,
        otpVerified: true, documents: uploadedDocs, kycCompleted: true,
        cibilScore: cibil?.cibilScore, cibilBreakdown: cibil?.cibilBreakdown,
        amount: amt, purpose: loanPurpose, duration: dur, emi, rate,
      });
      setMyLoans(prev => [data, ...prev]);
      toast('🎉 Loan application submitted!');
      // Reset
      setStep(0); setAadhaar(''); setPan(''); setKycResult(null);
      setOtp(['','','','','','']); setOtpVerified(false);
      setDocs({ rationCard: null, incomeCert: null, landRecord: null, bankStatement: null });
      setUploadedDocs({}); setCibil(null); setLoanAmt(''); setEmiResult(null);
    } catch (e) { toast('❌ Failed to submit'); }
    finally { setLoading(false); }
  };

  const aadhaarFmt = (v) => { const d = v.replace(/\D/g, '').slice(0, 12); return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim(); };

  const docLabels = [
    { key: 'rationCard', label: 'Ration Card', icon: '🪪' },
    { key: 'incomeCert', label: 'Income Certificate', icon: '📄' },
    { key: 'landRecord', label: 'Land Record (7/12)', icon: '🗺️' },
    { key: 'bankStatement', label: 'Bank Statement', icon: '🏦' },
  ];

  const docsReady = Object.values(docs).filter(Boolean).length >= 2;

  return (
    <>
      <div className="page-header"><h1>💰 Loan & Credit</h1><p>KYC Verification → CIBIL Score → Loan Application</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '1.5rem' }}>
        {/* Left: Application */}
        <div>
          <StepBar step={step} />
          <div className="card" style={{ marginTop: '1rem' }}>

            {/* ─── STEP 0: AADHAAR & PAN ─── */}
            {step === 0 && (<>
              <div className="card-header"><span className="card-title">🪪 KYC Verification</span></div>
              <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: '1.2rem' }}>Enter your Aadhaar number and PAN card for identity verification</p>
              <div className="form-group">
                <label>Aadhaar Number</label>
                <input value={aadhaar} onChange={e => setAadhaar(aadhaarFmt(e.target.value))} placeholder="XXXX XXXX XXXX" maxLength={14} style={{ letterSpacing: '2px', fontSize: '1.1rem', fontWeight: 700 }} />
                <div style={{ fontSize: '.75rem', color: aadhaar.replace(/\s/g, '').length === 12 ? 'var(--primary)' : 'var(--text3)', marginTop: '.3rem' }}>
                  {aadhaar.replace(/\s/g, '').length === 12 ? '✅ Valid format' : `${aadhaar.replace(/\s/g, '').length}/12 digits`}
                </div>
              </div>
              <div className="form-group">
                <label>PAN Card Number</label>
                <input value={pan} onChange={e => setPan(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" maxLength={10} style={{ letterSpacing: '2px', fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase' }} />
                <div style={{ fontSize: '.75rem', color: /^[A-Z]{5}\d{4}[A-Z]$/.test(pan) ? 'var(--primary)' : 'var(--text3)', marginTop: '.3rem' }}>
                  {/^[A-Z]{5}\d{4}[A-Z]$/.test(pan) ? '✅ Valid format' : 'Format: ABCDE1234F'}
                </div>
              </div>
              <button className="btn btn-green" onClick={verifyKYC} disabled={loading || aadhaar.replace(/\s/g, '').length !== 12 || !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)} style={{ width: '100%', marginTop: '.5rem' }}>
                {loading ? '⏳ Verifying...' : '🔐 Verify & Send OTP'}
              </button>
            </>)}

            {/* ─── STEP 1: OTP ─── */}
            {step === 1 && (<>
              <div className="card-header"><span className="card-title">📱 OTP Verification</span></div>
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <div style={{ fontSize: '.9rem', color: 'var(--text2)' }}>OTP sent to mobile linked with Aadhaar</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '.3rem' }}>📱 {kycResult?.mobileDisplay}</div>
              </div>
              <div className="otp-input-row">
                {otp.map((d, i) => (
                  <input key={i} ref={otpRefs[i]} className="otp-box" value={d} maxLength={1}
                    onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKey(i, e)}
                    disabled={otpVerified} style={otpVerified ? { borderColor: '#4CAF50', background: '#E8F5E9' } : {}} />
                ))}
              </div>
              {otpVerified ? (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>✅</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>OTP Verified Successfully!</div>
                </div>
              ) : (<>
                <button className="btn btn-green" onClick={verifyOTP} disabled={loading || otp.join('').length < 6} style={{ width: '100%', marginTop: '1rem' }}>
                  {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '.75rem', fontSize: '.82rem', color: 'var(--text3)' }}>
                  {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` :
                    <button onClick={() => { setOtpTimer(30); toast('📱 OTP resent!'); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Resend OTP</button>}
                </div>
              </>)}
            </>)}

            {/* ─── STEP 2: DOCUMENTS ─── */}
            {step === 2 && (<>
              <div className="card-header"><span className="card-title">📁 Upload Documents</span></div>
              <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: '1rem' }}>Upload at least 2 documents to proceed</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {docLabels.map(d => (
                  <label key={d.key} className={`loan-doc-zone${docs[d.key] ? ' uploaded' : ''}`}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleDocFile(d.key, e.target.files[0])} hidden />
                    <div style={{ fontSize: '1.8rem' }}>{d.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '.82rem', color: docs[d.key] ? 'var(--primary)' : 'var(--text2)' }}>{d.label}</div>
                    {docs[d.key] ? (
                      <div style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 700, marginTop: '.2rem' }}>✅ {docs[d.key].name.slice(0, 20)}</div>
                    ) : (
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Click to upload</div>
                    )}
                  </label>
                ))}
              </div>
              <button className="btn btn-green" onClick={uploadDocs} disabled={loading || !docsReady} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? '⏳ Uploading...' : `📤 Upload & Continue (${Object.values(docs).filter(Boolean).length}/4)`}
              </button>
            </>)}

            {/* ─── STEP 3: CIBIL SCORE ─── */}
            {step === 3 && (<>
              <div className="card-header"><span className="card-title">📊 Credit Score (CIBIL)</span></div>
              {!cibil ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="cibil-loading-spinner" />
                  <div style={{ fontWeight: 700, color: 'var(--text2)', marginTop: '1rem' }}>Fetching your credit score...</div>
                </div>
              ) : (<>
                <div style={{ textAlign: 'center' }}>
                  <CibilGauge score={cibil.cibilScore} category={cibil.category} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem', marginTop: '1rem' }}>
                  {[
                    { label: 'Payment History', val: `${cibil.cibilBreakdown.paymentHistory}%`, ico: '💳', color: '#4CAF50' },
                    { label: 'Credit Usage', val: `${cibil.cibilBreakdown.creditUtilization}%`, ico: '📊', color: '#FF9800' },
                    { label: 'Credit Age', val: `${cibil.cibilBreakdown.creditAge} yrs`, ico: '📅', color: '#2196F3' },
                    { label: 'Enquiries', val: cibil.cibilBreakdown.enquiries, ico: '🔍', color: '#9C27B0' },
                  ].map((c, i) => (
                    <div key={i} style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '12px', padding: '.8rem .5rem' }}>
                      <div style={{ fontSize: '1.3rem' }}>{c.ico}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: c.color, fontFamily: 'var(--font-head)' }}>{c.val}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 700 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-green" onClick={() => setStep(4)} style={{ width: '100%', marginTop: '1.2rem' }}>
                  {cibil.cibilScore >= 600 ? '✅ Eligible! Proceed to Loan' : '⚠️ Low Score — Proceed Anyway'}
                </button>
              </>)}
            </>)}

            {/* ─── STEP 4: LOAN APPLICATION ─── */}
            {step === 4 && (<>
              <div className="card-header"><span className="card-title">📝 Loan Application</span></div>
              <div className="form-group"><label>Loan Amount (₹)</label>
                <input value={loanAmt} onChange={e => setLoanAmt(e.target.value)} min="10000" placeholder="50000" type="number" />
              </div>
              <div className="form-group"><label>Purpose</label>
                <select value={loanPurpose} onChange={e => setLoanPurpose(e.target.value)}>
                  <option>Crop Production</option><option>Equipment Purchase</option>
                  <option>Irrigation Setup</option><option>Seeds & Fertilizer</option><option>Land Development</option>
                </select>
              </div>
              <div className="form-group"><label>Duration (Months)</label>
                <input value={loanDur} onChange={e => setLoanDur(e.target.value)} min="6" max="120" placeholder="24" type="number" />
              </div>
              <button className="btn btn-outline" onClick={calcEmi} style={{ width: '100%' }}>🧮 Calculate EMI</button>
              {emiResult && (
                <div className="emi-result" style={{ display: 'block', marginTop: '1rem' }}>
                  <div className="emi-grid">
                    <div className="emi-item"><div className="val">₹{emiResult.emi.toLocaleString()}</div><div className="key">Monthly EMI</div></div>
                    <div className="emi-item"><div className="val">{rate}%</div><div className="key">Interest Rate</div></div>
                    <div className="emi-item"><div className="val">₹{emiResult.total.toLocaleString()}</div><div className="key">Total Payable</div></div>
                  </div>
                </div>
              )}
              {/* Summary */}
              <div style={{ background: '#F1F8E9', borderRadius: '12px', padding: '1rem', marginTop: '1rem', fontSize: '.82rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '.5rem', color: 'var(--primary-dark)' }}>📋 Application Summary</div>
                <div>Aadhaar: <b>{kycResult?.maskedAadhaar}</b> | PAN: <b>{kycResult?.maskedPan}</b></div>
                <div>OTP: <b style={{ color: '#4CAF50' }}>Verified ✅</b> | Docs: <b>{Object.values(uploadedDocs).filter(Boolean).length} uploaded</b></div>
                <div>CIBIL: <b style={{ color: cibil?.cibilScore >= 700 ? '#4CAF50' : '#FF9800' }}>{cibil?.cibilScore} ({cibil?.category})</b></div>
              </div>
              <button className="btn btn-primary" onClick={applyLoan} disabled={loading || !loanAmt || parseFloat(loanAmt) < 10000} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? '⏳ Submitting...' : '🚀 Submit Loan Application'}
              </button>
            </>)}
          </div>
        </div>

        {/* Right: My Loans */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header"><span className="card-title">📋 My Loans</span></div>
          {myLoans.length === 0
            ? <div className="empty-state"><div className="e-icon">📄</div><p>No loan applications yet</p></div>
            : myLoans.map((l, i) => (
              <div key={i} className="loan-card" style={{ padding: '1rem', marginBottom: '.7rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b style={{ fontFamily: 'var(--font-head)' }}>{l._id?.slice(-6)?.toUpperCase()}</b>
                  <span className={`badge ${l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-orange'}`}>{l.status}</span>
                </div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)', marginTop: '.3rem' }}>₹{(l.amount || 0).toLocaleString()} – {l.purpose}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>CIBIL: {l.cibilScore || 'N/A'} | EMI: ₹{(l.emi || 0).toLocaleString()}/mo</div>
                {l.adminRemarks && <div style={{ fontSize: '.78rem', color: '#E65100', marginTop: '.3rem' }}>💬 {l.adminRemarks}</div>}
              </div>
            ))
          }
        </div>
      </div>
    </>
  );
}
