export const LoaderScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/50 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute h-full w-full animate-spin rounded-full border-[3px] border-accent/20 border-t-accent" />
        </div>
        <div className="flex items-end font-mono text-sm tracking-[0.2em] text-accent">
          LOADING
          <span className="animate-[bounce_1s_infinite_0ms]">.</span>
          <span className="animate-[bounce_1s_infinite_150ms]">.</span>
          <span className="animate-[bounce_1s_infinite_300ms]">.</span>
        </div>
      </div>
    </div>
  )
}
