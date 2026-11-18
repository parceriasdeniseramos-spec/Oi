import numpy as np, wave
SR=44100; D=10.0; N=int(SR*D)
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(3)
t_all=np.arange(N)/SR
def add(sig,start,gain=1.0,pan=0.0):
    i=int(start*SR); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*gain*(1-max(0,pan)); R[i:i+n]+=sig[:n]*gain*(1+min(0,pan))
def lp(x,k):  # moving average lowpass
    k=max(1,int(k)); return np.convolve(x,np.ones(k)/k,mode='same')
def kick(dur=.45):
    t=np.arange(int(SR*dur))/SR
    f=45+130*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t*7); s+=0.4*np.exp(-t*300)*rng.standard_normal(len(t))*0.3
    return np.tanh(s*2.2)
def clap(dur=.25):
    t=np.arange(int(SR*dur))/SR; n=rng.standard_normal(len(t))
    n=n-lp(n,6); env=np.exp(-t*22)
    for d in (0.008,0.017): env+= (t>d)*np.exp(-(t-d)*90)*0.6
    return n*env*0.7
def hat(dur=.06):
    t=np.arange(int(SR*dur))/SR; n=rng.standard_normal(len(t)); n=n-lp(n,3); return n*np.exp(-t*70)*0.35
def boom(dur=2.0):
    t=np.arange(int(SR*dur))/SR; f=38+60*np.exp(-t*6)
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*1.8)
    n=rng.standard_normal(len(t)); n=lp(n,4)*np.exp(-t*5)*0.5
    return np.tanh((s+n)*1.8)
def riser(dur):
    t=np.arange(int(SR*dur))/SR; n=rng.standard_normal(len(t))
    out=np.zeros_like(n); seg=2048
    for i in range(0,len(n),seg):
        p=i/len(n); k=int(lerp(40,2,p)); out[i:i+seg]=(n-lp(n,k))[i:i+seg] if False else lp(n,k)[i:i+seg]
    tone=np.sin(2*np.pi*np.cumsum(200+1800*(t/dur)**2)/SR)*0.15
    return (out*1.2+tone)*(t/dur)**2
def lerp(a,b,p): return a+(b-a)*p
def stab(freqs,dur=.35,bright=1.0):
    t=np.arange(int(SR*dur))/SR; s=np.zeros_like(t)
    for f in freqs:
        for d in (-0.12,0,0.12):
            ff=f*2**(d/12); s+=2*((t*ff)%1)-1
    s/= (len(freqs)*3)
    s=lp(s,int(6/bright)); return s*np.exp(-t*7)*0.9
def whoosh(dur=.25):
    t=np.arange(int(SR*dur))/SR; n=rng.standard_normal(len(t)); n=n-lp(n,10)
    env=np.sin(np.pi*t/dur)**2; return n*env*0.25
def bass(f,dur):
    t=np.arange(int(SR*dur))/SR; s=np.tanh(2*np.sin(2*np.pi*f*t))*0.5
    a=np.minimum(1,t*200)*np.exp(-t*4); return s*a
B=0.5
for k in range(20):
    tb=k*B
    if 2.5<=tb<3.0 or 6.0<=tb<6.5: continue   # breaks before drops
    add(kick(),tb,0.95)
    if k%2==1: add(clap(),tb,0.55,0.0)
    add(hat(),tb+0.25,0.5,0.3 if k%2 else -0.3)
    if tb>=3: add(hat(.04),tb+0.125,0.25,-0.2); add(hat(.04),tb+0.375,0.25,0.2)
    if not(2.5<=tb+0.25<3.0 or 6.0<=tb+0.25<6.5):
        add(bass(55 if tb<8 else 49,0.24),tb+0.25,0.6)
for h in (0,3.0,6.5,8.0): add(boom(),h,0.9)
add(riser(1.0),2.0,0.5); add(riser(0.6),5.9,0.45); add(riser(0.5),7.5,0.3)
# stabs on word hits (Am chord stabs) 
Am=[220,261.6,329.6]; F=[174.6,220,261.6]; C=[261.6,329.6,392]; G=[196,246.9,293.7]
for tb,ch in ((0.5,Am),(1.0,Am),(1.5,F),(2.0,C),(2.5,G)): add(stab(ch),tb,0.45)
for tb,ch in ((6.5,Am),(7.0,F),(7.5,C),(8.0,Am),(8.5,Am),(9.0,F),(9.5,G)): add(stab(ch,.3),tb,0.4)
for w in (3.5,4.0,4.5,5.0,5.25,4.5): add(whoosh(),w-0.1,0.6,0.4)
# sparkle at the end
t=np.arange(int(SR*1.5))/SR
for i,f in enumerate((1760,2093,2637,3520)):
    add(np.sin(2*np.pi*f*t)*np.exp(-t*5)*0.08,8.3+i*0.12,1,0.5 if i%2 else -0.5)
# master
mix=np.stack([L,R],1)
fade=np.ones(N); fn=int(.35*SR); fade[-fn:]=np.linspace(1,0,fn)
mix*=fade[:,None]
mix=np.tanh(mix*1.1); mix/=np.abs(mix).max()*1.12
pcm=(mix*32767).astype(np.int16)
with wave.open('audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
