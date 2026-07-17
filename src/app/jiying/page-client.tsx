"use client"
import Link from "next/link"
import { useEffect } from "react"
import { useJiyingUser } from "./layout"

const FAQ = [
  { q: "20Ԫ��Ŀ��Կ�һ����ý�幫˾��", a: "�ǵġ�20Ԫ��7������ۡ�AI����������������衢ÿ���Զ��������ݡ���ֻ��Ҫ���Լ����˺ţ�ʣ�µĽ������ǡ�" },
  { q: "����Ҫ��ʲô��", a: "�������� 3����ƫ���ʾ� �� ÿ��30����˷�����ѡ�⡢�İ�����Ƶ�����ۻظ������ݷ�������AIȫ�Զ���" },
  { q: "���ʺ���ʲô����", a: "ϵͳ�Զ�ƥ�䡣�����С���顢��ʳ�������ĸӤ�������Ƽ�����Ϸ��Bվ����������Ƶ�š�ƥ��ȵ���85%�Զ�������" },
  { q: "�ʹ���Ӫ��˾����ʲô���ƣ�", a: "����Ӫ��3000-15000/�£���Ӱ��20�𲽡�AI����Ϣ������١����Ǽۡ����ݲ���10�����ɱ�1/100��" },
]

export default function JiyingHome() {
  const { user } = useJiyingUser()

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual"
      window.scrollTo(0, 0)
    }
  }, [])


  // ����ģʽ����״̬
  const [user, setUser] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(3)
  const [userLevel, setUserLevel] = useState("��ͭ")
  const [quotaPlan, setQuotaPlan] = useState("free")
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("sijian_session")
    if (raw) try { setUser(JSON.parse(raw)) } catch {}
    setIsPaid(localStorage.getItem("sijian_paid") === "true")
    try { const u = parseInt(localStorage.getItem("jiying_usage_count") || "0", 10); if (!isNaN(u)) setUsageCount(u) } catch {}
    try { const l = localStorage.getItem("jiying_level") || "��ͭ"; setUserLevel(l) } catch {}
  }, [])

  const NAV_ITEMS_HOME = [
    { href: "/jiying/agents", label: "?? AI����" },
    { href: "/jiying/daily-content", label: "?? ÿ������" },
    { href: "/jiying/manga", label: "?? ����ӰƬ����" },
    { href: "/jiying/digital-human", label: "??? �����˿ڲ�" },
    { href: "/jiying/studio", label: "??? ����ͼƬ��" },
    { href: "/jiying/media-library", label: "??? �زĿ�" },
    { href: "/jiying/portfolio", label: "??? ��Ʒչʾ" },
  ]

  return (
    <div className="min-h-screen bg-[#0C0C14]">
      <header className="relative z-10 bg-[#0C0C14]/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/jiying" className="flex items-center gap-2.5">?? ��Ӱ</Link>
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS_HOME.map(item => (
                <Link key={item.href} href={item.href} className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] rounded-lg">{item.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user && <span className="text-[10px] text-[#5A5A72] bg-[#0C0C14] px-2.5 py-1 rounded-lg">{usageLimit-usageCount}/{usageLimit}</span>}
            {user && !isPaid && <Link href="/jiying/pricing" className="px-3 py-1 text-[10px] font-bold text-[#0C0C14] bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-full">? ����</Link>}
            {user ? <button onClick={()=>{localStorage.clear();setUser(null)}} className="text-[10px] text-[#5A5A72]">�˳�</button> : <Link href="/jiying" className="text-[10px] text-[#F59E0B]">��¼</Link>}
            <button onClick={()=>setMobileOpen(!mobileOpen)} className="md:hidden">{mobileOpen?"?":"?"}</button>
          </div>
        </div>
      </header>
      {user && !isPaid && (
        <div className="bg-gradient-to-r from-[#F59E0B]/10 to-[#F97316]/10 border-b border-[#F59E0B]/20 px-4 py-2 text-center">
          <Link href="/jiying/pricing" className="text-xs text-[#F59E0B]">?? ��20Ԫ���������ý�幫˾</Link>
        </div>
      )}
      <div classNa
      {/* ������ HERO ������ */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/3 via-transparent to-[#F97316]/3 animate-gradient" style={{backgroundSize:'200% 200%'}} />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-[#F59E0B]/8 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-[#F97316]/4 blur-[150px]" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18182A] border border-[#F59E0B]/15 text-xs text-[#F59E0B] mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
            ��Ӱ �� AI��ý�幤��
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="bg-gradient-to-r from-[#E8E8F0] via-[#F59E0B] to-[#F97316] bg-clip-text text-transparent animate-gradient">20Ԫ�������</span>
            <br />
            <span className="bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F97316] bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 100%', animation: 'gradient 4s ease infinite' }}>��ý�幫˾</span>
          </h1>
          <p className="text-base md:text-lg text-[#9898B0] max-w-2xl mx-auto mb-10 leading-relaxed">
            15��AIר�� �� ����·������ �� ÿ���Զ���������<br className="hidden sm:block" />
            һվʽAI���ܣ���0��1�������Ʒ��
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jiying/onboarding" className="btn-primary px-8 py-3.5 rounded-xl text-sm font-semibold">?? ��������</Link>
            <Link href="/jiying/agents/agent-14"
              className="btn-ghost px-8 py-3.5 rounded-xl text-sm font-medium">��������ǩSEO</Link>
          </div>
          <p className="text-xs text-[#5A5A72] mt-6">����ע�ṫ˾ �� �����Ӷ�Ŷ� �� ȫ�Զ���Ӫ �� ��ʱ��ͣ</p>
        </div>
      </section>

      {/* ������ 4����� �� 20Ԫ����˾������· ������ */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <h2 className="text-center text-sm text-[#5A5A72] mb-4 tracking-wider">�Ĳ����������ý�幫˾</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { t: "??", title: "�� ��˾����", desc: "��ƽ̨�˺�", h: "/jiying/onboarding" },
            { t: "?", title: "�� AI�������", desc: "�����������", h: "/jiying/launch" },
            { t: "?", title: "�� ÿ�����", desc: "30����˷���", h: "/jiying/review" },
            { t: "??", title: "�� AI������Ӫ", desc: "���ܵ��ȹ���̨", h: "/jiying/orchestrator" },
          ].map(s => (
            <Link key={s.title} href={s.h}
              className="glass-card p-5 text-center hover:shadow-hover transition-all group">
              <div className="text-2xl mb-2">{s.t}</div>
              <div className="text-sm font-semibold bg-gradient-to-r from-[#E8E8F0] via-[#F59E0B] to-[#F97316] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient group-hover:from-[#F59E0B] group-hover:via-[#F97316] group-hover:to-[#F59E0B]">{s.title}</div>
              <div className="text-[10px] text-[#5A5A72] mt-0.5">{s.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ������ ����vs�õ� ������ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-8">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-[#9A9AB0] to-[#F59E0B] bg-clip-text text-transparent mb-5 tracking-wider">��ֻ��Ҫ����</h3>
            <ul className="space-y-4">
              {["20Ԫ��7�����飩","ÿ��30�����","3�������ʾ�","���ء�ճ��������"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#9898B0]">
                  <span className="w-5 h-5 rounded-full border border-[#2A2A38] flex items-center justify-center text-[10px] text-[#5A5A72] shrink-0">?</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-8 border-[#F59E0B]/15 bg-[#F59E0B]/[0.04]">
            <h3 className="text-sm font-semibold bg-gradient-to-r from-[#F59E0B] to-[#EA580C] bg-clip-text text-transparent mb-5 tracking-wider">�㽫�õ�</h3>
            <ul className="space-y-4">
              {["15��AIר��24Сʱ����","ÿ��3���İ�+1����Ƶ","AI���ܿͷ��ظ�����","���ݸ���+�����Ż�","����·���Զ�ƥ��"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#E8E8F0]">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center text-[10px] text-white shrink-0">?</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ������ ��Ʒ�Ա� ������ */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-[#E8E8F0] via-[#F59E0B] to-[#F97316] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient mb-8">��Ӱ vs ��������</h2>
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-xs min-w-[520px] md:min-w-0">
            <thead>
              <tr className="bg-[#18182A] border-b border-[#2A2A38]">
                <th className="text-left px-4 py-3 font-semibold text-[#9898B0]">�Ա�ά��</th>
                <th className="text-center px-4 py-3 font-semibold text-[#5A5A72]">����Ӫ��˾</th>
                <th className="text-center px-4 py-3 font-semibold text-[#5A5A72]">MoneyPrinter</th>
                <th className="text-center px-4 py-3 font-semibold text-[#F59E0B] bg-[#F59E0B]/8">��Ӱ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EE]">
              {[
                ["�𲽼۸�","��3000-15000/��","��ѣ��輼����","��20"],
                ["�������","����ǩ��ͬ","װPython����","ɨ�븶20Ԫ"],
                ["С�׿���","?","?","?"],
                ["���ݴ���","?","?��Ƶ","?ͼ��+��Ƶ+����"],
                ["�������","?","?","? 3��Ա�"],
                ["BGM+��Ч","?","?","?"],
                ["���ݸ���","?","?","? ÿ������"],
                ["AI���ܿͷ�","?","?","? �Զ��ظ�"],
                ["˽������","?? ���շ�","?","? �Զ�����"],
                ["�Ա����","?","?","? �Զ����"],
                ["���轨ģ","?","?","? 15��Agent"],
                ["ÿ���ʱ","1-2Сʱ��ͨ","1Сʱ����","30�����"],
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[#18182A]" : "bg-[#18182A]/50"}>
                  <td className="px-4 py-2.5 text-[#E8E8F0] font-medium">{row[0]}</td>
                  <td className="px-4 py-2.5 text-center text-[#5A5A72]">{row[1]}</td>
                  <td className="px-4 py-2.5 text-center text-[#5A5A72]">{row[2]}</td>
                  <td className="px-4 py-2.5 text-center text-[#F59E0B] font-semibold bg-[#F59E0B]/8">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ������ ���� ������ */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-[#E8E8F0] via-[#F59E0B] to-[#F97316] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient mb-10">����</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { n: "���鿨", p: "��20", u: "һ����", d: "7��ȫ����", b: "������", c: "from-[#F59E0B] to-[#EA580C]" },
            { n: "�¿�", p: "��99", u: "/��", d: "ÿ��3��+1����", b: "����", c: "from-[#EA580C] to-[#F59E0B]" },
            { n: "�꿨", p: "��799", u: "/��", d: "�֣�66/��", b: "���", c: "from-[#F97316] to-[#F59E0B]" },
            { n: "Pro", p: "��299", u: "/��", d: "���˺š�5��", b: "������", c: "from-[#1E1E2E] to-[#3A3A52]" },
          ].map(c => (
            <div key={c.n} className="glass-card p-6 text-center hover:shadow-hover transition-all relative">
              <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r ${c.c} text-[9px] font-medium text-white`}>{c.b}</span>
              <div className="text-sm font-medium text-[#5A5A72]">{c.n}</div>
              <div className="mt-2"><span className="text-2xl font-extrabold text-[#E8E8F0]">{c.p}</span><span className="text-xs text-[#5A5A72] ml-0.5">{c.u}</span></div>
              <div className="text-xs text-[#5A5A72] mt-1.5">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ������ FAQ ������ */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-[#E8E8F0] via-[#F59E0B] to-[#F97316] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient mb-8">��������</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="glass-card overflow-hidden group">
              <summary className="px-5 py-3.5 text-sm bg-gradient-to-r from-[#E8E8F0] via-[#F59E0B] to-[#E8E8F0] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient cursor-pointer hover:from-[#F59E0B] hover:to-[#F97316] transition-all flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-[#5A5A72] group-open:rotate-180 transition-transform text-xs">��</span>
              </summary>
              <div className="px-5 pb-4 text-xs text-[#9898B0] leading-relaxed border-t border-[#2A2A38] pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>


      {/* ������ CTA ������ */}
      <section className="max-w-3xl mx-auto px-6 text-center pt-8">
        <div className="glass-card p-10">
          <div className="text-4xl mb-4">??</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#1A1A2E] to-[#F59E0B] bg-clip-text text-transparent mb-2">���ھͿ��������ý�幫˾</h2>
          <p className="text-sm text-[#9898B0] mb-6">20Ԫ����7�� �� ��������ʱͣ �� �����κγ�ŵ</p>
          <Link href="/jiying/onboarding"
            className="btn-primary inline-block px-8 py-3 rounded-xl text-sm font-semibold">?? ��20Ԫ����˾</Link>
        </div>
        <div className="mt-6">
          <div className="text-xs text-[#F59E0B] font-medium mt-2">��Ӱ �� ���������Լ���ӰƬ</div>        </div>
      </section>
    </div>
  )
}
