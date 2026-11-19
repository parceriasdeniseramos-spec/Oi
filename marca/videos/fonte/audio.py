import numpy as np, wave
SR=44100; D=16.0; N=int(SR*D); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(9)
def add(sig,st,g=1.0,pan=0.0):
    i=int(st*SR); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*g*(1-max(0,pan)); R[i:i+n]+=sig[:n]*g*(1+min(0,pan))
def lp(x,k): k=max(1,int(k)); return np.convolve(x,np.ones(k)/k,mode='same')
def hz(m): return 440*2**((m-69)/12)
def kick(d=.4):
    t=np.arange(int(SR*d))/SR; f=48+110*np.exp(-t*30); return np.tanh(2*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*8))
def clap(d=.22):
    t=np.arange(int(SR*d))/SR; n=rng.standard_normal(len(t)); n=n-lp(n,6); e=np.exp(-t*24)
    for dd in (.009,.018): e+=(t>dd)*np.exp(-(t-dd)*90)*.5
    return n*e*.55
def hat(d=.05):
    t=np.arange(int(SR*d))/SR; n=rng.standard_normal(len(t)); n=n-lp(n,3); return n*np.exp(-t*80)*.3
def pluck(m,d=.35,v=.25):
    t=np.arange(int(SR*d))/SR; f=hz(m)
    s=sum(a*np.sign(np.sin(2*np.pi*f*h*t))*0.5+a*np.sin(2*np.pi*f*h*t)*0.5 for h,a in ((1,1),(2,.3)))
    return lp(s,5)*np.exp(-t*9)*v
def pad(ms,d):
    t=np.arange(int(SR*d))/SR; s=np.zeros_like(t)
    for m in ms:
        for dt in (-.07,0,.07): s+=2*((t*hz(m)*2**(dt/12))%1)-1
    s=lp(s,35)/(len(ms)*3); return s*np.minimum(1,t/.4)*np.minimum(1,(d-t)/.4)*.25
def boom(d=1.5):
    t=np.arange(int(SR*d))/SR; f=40+70*np.exp(-t*5); s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*2)
    n=lp(rng.standard_normal(len(t)),4)*np.exp(-t*6)*.4; return np.tanh((s+n)*1.6)
def riser(d):
    t=np.arange(int(SR*d))/SR; n=rng.standard_normal(len(t)); out=np.zeros_like(n)
    for i in range(0,len(n),2048): k=int(40-38*i/len(n)); out[i:i+2048]=lp(n,k)[i:i+2048]
    return (out+np.sin(2*np.pi*np.cumsum(300+2000*(t/d)**2)/SR)*.12)*(t/d)**2
def shimmer(st):
    t=np.arange(int(SR*1.2))/SR
    for i,f in enumerate((1760,2217,2637,3520)): add(np.sin(2*np.pi*f*t)*np.exp(-t*4)*.06,st+i*.07,1,.5 if i%2 else -.5)
B=0.5
chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]  # Am F C G
for bar in range(8):
    t0=bar*2.0; ch=chords[bar%4]
    add(pad(ch,2.1),t0,1.0)
    if t0<2.0: continue
    for k in range(4):
        tb=t0+k*B
        if 4.2<=tb<4.6 or 13.4<=tb<13.8: continue
        add(kick(),tb,.9)
        if k%2==1: add(clap(),tb,.5)
        add(hat(),tb+.25,.45,.3 if k%2 else -.3)
        add(pluck(ch[(k)%3]+12,.3,.22),tb+.25,1,-.2 if k%2 else .2)
    add(np.tanh(2*np.sin(2*np.pi*hz(ch[0]-24)*np.arange(int(SR*1.9))/SR))*np.exp(-np.arange(int(SR*1.9))/SR*1.2)*.35,t0,1)
for h in (0.5,4.6,13.8): add(boom(),h,.85)
add(riser(.9),1.6,.4); add(riser(.6),4.0,.35); add(riser(.6),13.2,.35)
for st in (.5,9.4,11.8,14.3): shimmer(st)
mix=np.stack([L,R],1)
for d,g in ((.03,.25),(.07,.18),(.13,.12)):
    k=int(d*SR); mix[k:,0]+=mix[:-k,1]*g; mix[k:,1]+=mix[:-k,0]*g
fo=int(1.0*SR); env=np.ones(N); env[-fo:]=np.linspace(1,0,fo); mix*=env[:,None]
mix=np.tanh(mix*1.1); mix/=np.abs(mix).max()*1.12
with wave.open('audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok')
