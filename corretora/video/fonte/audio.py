import numpy as np, wave
SR=44100; D=16.0; N=int(SR*D)
L=np.zeros(N); R=np.zeros(N)
def add(sig,start,gain=1.0,pan=0.0):
    i=int(start*SR); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*gain*(1-max(0,pan)); R[i:i+n]+=sig[:n]*gain*(1+min(0,pan))
def lp(x,k): k=max(1,int(k)); return np.convolve(x,np.ones(k)/k,mode='same')
def hz(m): return 440*2**((m-69)/12)
def piano(m,dur=3.0,vel=1.0):
    t=np.arange(int(SR*dur))/SR; f=hz(m)
    s=sum(a*np.sin(2*np.pi*f*h*t*(1+0.0004*h))*np.exp(-t*(1.6+h*0.9)) for h,a in ((1,1),(2,.45),(3,.22),(4,.12),(5,.06)))
    s*=np.minimum(1,t*400); return s*vel*0.22
def pad(ms,dur):
    t=np.arange(int(SR*dur))/SR; s=np.zeros_like(t)
    for m in ms:
        for d in (-0.08,0,0.08):
            f=hz(m)*2**(d/12); s+=2*((t*f)%1)-1
    s=lp(s,40); s/=len(ms)*3
    env=np.minimum(1,t/1.2)*np.minimum(1,(dur-t)/1.2)
    return s*env*0.22
# chords (72 BPM feel), 4 chords x 4s: Fmaj7, Am7, Dm9, Bbmaj7 -> resolve F
chords=[([53,57,60,64],[65,69,72,76]),([57,60,64,67],[69,72,76,79]),([50,53,57,60],[62,65,69,72,76]),([46,50,53,57],[58,62,65,69])]
for i,(low,high) in enumerate(chords):
    t0=i*4.0
    add(pad(low,4.6),t0-0.2 if i else 0,1.0,0)
    add(piano(low[0]-12,4,0.9),t0,1,0)
    # arpeggio
    for j,m in enumerate(high+high[::-1][1:3]):
        add(piano(m,2.5,0.55+0.1*(j%2)),t0+0.5+j*0.55,1,(-0.4 if j%2 else 0.4))
# final F chord bloom at 13.7
add(pad([53,57,60,64,69],2.6),13.6,1.1)
for j,m in enumerate([65,69,72,77,81]): add(piano(m,2.6,0.6),13.7+j*0.09,1,0.3 if j%2 else -0.3)
# soft shimmer
t=np.arange(int(SR*2.5))/SR
for i,f in enumerate((1760,2217,2637)): add(np.sin(2*np.pi*f*t)*np.exp(-t*2.5)*0.03,14.5+i*0.18,1,0.5 if i%2 else -0.5)
# simple reverb (feedback delays)
mix=np.stack([L,R],1)
for d,g in ((0.031,.35),(0.047,.3),(0.089,.25),(0.137,.2),(0.211,.15)):
    k=int(d*SR); mix[k:,0]+=mix[:-k,1]*g; mix[k:,1]+=mix[:-k,0]*g
fi=int(.3*SR); fo=int(1.2*SR); env=np.ones(N); env[:fi]=np.linspace(0,1,fi); env[-fo:]=np.linspace(1,0,fo)
mix*=env[:,None]; mix=np.tanh(mix*1.2); mix/=np.abs(mix).max()*1.15
with wave.open('audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok')
