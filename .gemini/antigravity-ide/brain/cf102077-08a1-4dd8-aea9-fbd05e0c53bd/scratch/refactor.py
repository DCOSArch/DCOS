import re

path = r"c:\Users\bentn\OneDrive\Desktop\DEs\src\components\dashboards\DentistDashboard.tsx"

with open(path, "r", encoding="utf-8") as f:
    code = f.read()

if "Create New Lab Case" not in code:
    print("Error: DentistDashboard.tsx content not found or incorrect.")
    exit(1)

# 1. Replace trigger, dialog content class and header
dialog_old = """        <DialogTrigger render={<Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 p-0 z-50 focus:outline-none" />}>
          <Plus className="h-6 w-6 text-white" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Lab Case</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit a new prescription to the dental laboratory using Sirona-style 5-Tab Pipeline.
            </DialogDescription>
          </DialogHeader>"""

dialog_new = """        <DialogTrigger render={<Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary-hover p-0 z-50 focus:outline-none" />}>
          <Plus className="h-6 w-6 text-primary-foreground" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[950px] w-[95vw] h-[90vh] md:h-[80vh] flex flex-col bg-background border-border p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border">
            <DialogTitle className="text-foreground">Create New Lab Case</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit a new prescription to the dental laboratory using Sirona-style 5-Tab Pipeline.
            </DialogDescription>
          </DialogHeader>"""

code = code.replace(dialog_old, dialog_new)

# 2. Replace timeline and Step 0 start
timeline_and_step0_pattern = r'          <div className="flex justify-between items-center my-4 border-b border-border pb-4">.*?          </div>\s*\n\s*<div className="grid gap-4 py-2 min-h-\[260px\]">\s*\n\s*\{currentStep === 0 && \(\s*\n\s*<div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">'

timeline_and_step0_new = """          <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
            {/* Left sidebar - Vertical Timeline */}
            <div className="w-full md:w-[220px] bg-muted/20 border-b md:border-b-0 md:border-r border-border p-4 md:p-6 flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-x-visible shrink-0">
              {steps.map((step, idx) => {
                const isCurrent = idx === currentStep;
                const isDone = idx < currentStep || isStepComplete(idx);
                const isSelectable = idx === 0 || Array.from({ length: idx }).every((_, i) => isStepComplete(i));
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-all focus:outline-none relative group ${
                      isCurrent
                        ? 'bg-primary/10 text-primary font-semibold'
                        : isDone
                        ? 'text-emerald-600 hover:bg-muted dark:text-emerald-400'
                        : 'text-muted-foreground hover:bg-muted'
                    } ${!isSelectable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Step indicator circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold shrink-0 transition-colors ${
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isDone
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-muted-foreground/30'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Step labels */}
                    <div className="hidden md:flex flex-col">
                      <span className="text-xs font-semibold leading-tight">{step.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{step.desc}</span>
                    </div>

                    {/* Mobile label */}
                    <span className="text-[10px] font-medium md:hidden">{step.label}</span>

                    {/* Pulsating active indicator */}
                    {isCurrent && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right step content with sliding carousel */}
            <div className="flex-1 p-6 overflow-y-auto min-w-0">
              <div className="relative w-full overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentStep * 100}%)` }}
                >
                  {/* Step 0: Admin */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">"""

code, count = re.subn(timeline_and_step0_pattern, timeline_and_step0_new, code, flags=re.DOTALL)
print(f"Replaced timeline and step0 pattern: {count} times")

# 3. Step 0 end & Step 1 start
step0_end_step1_start_old = """              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">"""

step0_end_step1_start_new = """                    </div>
                  </div>

                  {/* Step 1: Scan */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">"""

code = code.replace(step0_end_step1_start_old, step0_end_step1_start_new)

# 4. Step 1 end & Step 2 start
step1_end_step2_start_old = """                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">"""

step1_end_step2_start_new = """                    </div>
                  )}
                    </div>
                  </div>

                  {/* Step 2: Model */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">"""

code = code.replace(step1_end_step2_start_old, step1_end_step2_start_new)

# 5. Step 2 end & Step 3 start
step2_end_step3_start_old = """                </>
              )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">"""

step2_end_step3_start_new = """                    </>
                  )}
                    </div>
                  </div>

                  {/* Step 3: CAD */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">"""

code = code.replace(step2_end_step3_start_old, step2_end_step3_start_new)

# 6. Step 3 end & Step 4 start
step3_end_step4_start_old = """                )}
              </div>
            )}

            {/* Step 4: CAM Manufacturing */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">"""

step3_end_step4_start_new = """                )}
                    </div>
                  </div>

                  {/* Step 4: CAM */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">"""

code = code.replace(step3_end_step4_start_old, step3_end_step4_start_new)

# 7. Step 4 end & Footer start
step4_end_footer_start_old = """                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center gap-2 sm:gap-0 mt-4 border-t border-border pt-4">"""

step4_end_footer_start_new = """                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center gap-2 sm:gap-0 p-6 border-t border-border bg-card shrink-0">"""

code = code.replace(step4_end_footer_start_old, step4_end_footer_start_new)

# 8. Replace buttons in Footer
buttons_old = """                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={uploadState === 'analyzing' || !isStepComplete(4)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleSubmitCase(false)}
                >
                  Submit Case"""

buttons_new = """                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={uploadState === 'analyzing' || !isStepComplete(4)}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                  onClick={() => handleSubmitCase(false)}
                >
                  Submit Case"""

code = code.replace(buttons_old, buttons_new)

# 9. Search and replace hardcoded colors and badges
code = code.replace("border-2 border-blue-600 shadow-md scale-105", "border-2 border-primary shadow-md scale-105")
code = code.replace('<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />', '<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />')
code = code.replace('bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-[9px] px-1 py-0 h-4', 'bg-muted text-muted-foreground border-border hover:bg-muted text-[9px] px-1 py-0 h-4')
code = code.replace('bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100 text-[9px] px-1 py-0 h-4', 'bg-muted text-muted-foreground border-border hover:bg-muted text-[9px] px-1 py-0 h-4')

# Save changes back
with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("Refactoring DentistDashboard.tsx completed successfully!")
