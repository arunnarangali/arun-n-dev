import { motion, type Variants } from 'framer-motion'

type CodeWindowCardProps = {
  variants: Variants
}

export const CodeWindowCard = ({ variants }: CodeWindowCardProps) => {
  return (
    <motion.div
      variants={variants}
      className="relative overflow-hidden rounded-[2.5rem] border border-outline-variant bg-[#0d121c] shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Developer.tsx</span>
      </div>
      <div className="p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all @3xl:p-8 @3xl:text-sm">
        <div><span className="text-blue-400">const</span> <span className="text-yellow-200">developer</span> = {'{'}</div>
        <div className="pl-4 @3xl:pl-6"><span className="text-purple-400">name</span>: <span className="text-orange-300">"Arun N"</span>,</div>
        <div className="pl-4 @3xl:pl-6"><span className="text-purple-400">role</span>: <span className="text-orange-300">"Frontend Architect"</span>,</div>
        <div className="pl-4 @3xl:pl-6"><span className="text-purple-400">vision</span>: <span className="text-orange-300">"Resilient Digital Ecosystems"</span>,</div>
        <div className="pl-4 @3xl:pl-6"><span className="text-purple-400">stack</span>: [<span className="text-orange-300">"React"</span>, <span className="text-orange-300">"TypeScript"</span>, <span className="text-orange-300">"Golang"</span>],</div>
        <div className="pl-4 @3xl:pl-6"><span className="text-purple-400">accessibility</span>: <span className="text-blue-400">true</span></div>
        <div>{'};'}</div>
        <div className="mt-4 text-gray-500">{'// Optimized for high-impact production...'}</div>
      </div>
    </motion.div>
  )
}
