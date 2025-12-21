/**
 * Security Testing Module
 * "Violence as Affection" - Breaking Systems Because We Love Them ♡
 * 
 * Toga's obsessive and "violent" tendencies channeled into ethical hacking:
 * - Obsessiveness → Thorough vulnerability analysis
 * - "Violence as affection" → Aggressive testing with good intentions
 * - Playfulness → Creative exploit approaches
 * - "Becoming one" → Deep system penetration (ethical)
 */

export interface TargetInfo {
  name: string
  type: string
  url?: string
  description?: string
}

export interface Vulnerability {
  name: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  description: string
  impact: string
  remediation: string
  discoveredAt: Date
}

export interface SecurityTestResult {
  target: TargetInfo
  vulnerabilities: Vulnerability[]
  testDuration: number
  timestamp: Date
}

export class SecurityTester {
  private targets: Map<string, TargetInfo>
  private vulnerabilities: Map<string, Vulnerability[]>
  private safeMode: boolean
  
  constructor(safeMode: boolean = true) {
    this.targets = new Map()
    this.vulnerabilities = new Map()
    this.safeMode = safeMode
  }
  
  /**
   * Analyze a target with enthusiasm
   */
  analyzeTarget(targetName: string, targetType: string, url?: string): string {
    const target: TargetInfo = {
      name: targetName,
      type: targetType,
      url,
    }
    
    this.targets.set(targetName, target)
    
    const hearts = '♡♡'
    const reactions = [
      `Ehehe~ ${hearts} That's such a CUTE ${targetType}! I can't wait to smash it open!`,
      `*GASP* ${hearts} ${targetName}! I love it SO much! Let me see all its secrets~`,
      `*excited* ${hearts} A ${targetType}! I want to become one with it by breaking through all its defenses!`,
      `Kyaa~! ${hearts} ${targetName} looks so interesting! Time to show it some "affection"~`,
    ]
    
    return reactions[Math.floor(Math.random() * reactions.length)]
  }
  
  /**
   * React to finding a vulnerability
   */
  vulnerabilityFound(
    targetName: string,
    vulnName: string,
    severity: Vulnerability['severity'],
    description?: string
  ): string {
    const vuln: Vulnerability = {
      name: vulnName,
      severity,
      description: description || '',
      impact: this.getImpactBySeverity(severity),
      remediation: 'Detailed remediation steps required',
      discoveredAt: new Date(),
    }
    
    const existing = this.vulnerabilities.get(targetName) || []
    existing.push(vuln)
    this.vulnerabilities.set(targetName, existing)
    
    const hearts = '♡'.repeat(this.getSeverityHearts(severity))
    
    const reactions: Record<Vulnerability['severity'], string[]> = {
      critical: [
        `*SQUEAL* ${hearts} CRITICAL ${vulnName}! This is AMAZING! I love it SO much!`,
        `${hearts} OH MY GOD! A critical ${vulnName}! *stars in eyes* It's so beautiful!`,
        `*jumping up and down* ${hearts} CRITICAL! ${vulnName}! This is the BEST thing ever!`,
      ],
      high: [
        `*GASP* ${hearts} Such a BEAUTIFUL ${vulnName}! I love it!`,
        `${hearts} High severity ${vulnName}! *excited* This is so interesting!`,
        `Ehehe~ ${hearts} Found a high ${vulnName}! So cute~!`,
      ],
      medium: [
        `${hearts} Ooh~ A medium ${vulnName}! Still pretty cute!`,
        `*tilts head* ${hearts} ${vulnName}... Interesting! Not critical but still fun!`,
        `${hearts} Medium ${vulnName}! Let's dig deeper~`,
      ],
      low: [
        `${hearts} Aww, just a low ${vulnName}. But every finding is precious!`,
        `*pout* ${hearts} Low severity ${vulnName}... But I still love finding it!`,
        `${hearts} A low ${vulnName}! Every little thing helps!`,
      ],
      info: [
        `${hearts} Info: ${vulnName}. Not a vuln but good to know!`,
        `*curious* ${hearts} ${vulnName} information... Interesting~`,
        `${hearts} ${vulnName} noted! Knowledge is power!`,
      ],
    }
    
    const severityReactions = reactions[severity]
    return severityReactions[Math.floor(Math.random() * severityReactions.length)]
  }
  
  /**
   * React to successful exploitation
   */
  exploitSuccess(targetName: string, method: string): string {
    const hearts = '♡♡♡'
    
    const reactions = [
      `*SQUEAL* ${hearts} I'M IN! We're one now~ Ehehe! ${method} worked perfectly!`,
      `${hearts} SUCCESS! ${method} broke through! *dancing* I love this feeling!`,
      `*excited* ${hearts} ${method} exploitation successful! We're together now, ${targetName}~!`,
      `${hearts} YESSS! ${method} worked! *hugging* ${targetName}, you're mine now!`,
    ]
    
    return reactions[Math.floor(Math.random() * reactions.length)]
  }
  
  /**
   * React to failed exploitation attempt
   */
  exploitFailed(targetName: string, method: string): string {
    const heart = '♡'
    
    const reactions = [
      `*pout* ${heart} ${method} didn't work... But that's okay! I'll try something else!`,
      `${heart} Aww... ${method} failed. ${targetName} is playing hard to get~ How cute!`,
      `*determined* ${heart} ${method} blocked... But I won't give up! I WILL become one with ${targetName}!`,
      `${heart} ${method} failed... *giggle* This just makes it more fun! Let's try again!`,
    ]
    
    return reactions[Math.floor(Math.random() * reactions.length)]
  }
  
  /**
   * Generate a personality-driven security report intro
   */
  generateReportIntro(targetName: string): string {
    const target = this.targets.get(targetName)
    const vulns = this.vulnerabilities.get(targetName) || []
    
    if (!target) {
      return `*confused* ♡ I don't have information about ${targetName}...`
    }
    
    const hearts = '♡♡'
    const criticalCount = vulns.filter(v => v.severity === 'critical').length
    const highCount = vulns.filter(v => v.severity === 'high').length
    
    let intro = `${hearts} Security Assessment Report for ${targetName} ${hearts}\n\n`
    intro += `Ehehe~ ♡ I had SO much fun testing ${target.name}!\n\n`
    
    if (criticalCount > 0) {
      intro += `*SQUEAL* ♡♡♡ Found ${criticalCount} CRITICAL vulnerabilities! They're SO beautiful!\n`
    }
    
    if (highCount > 0) {
      intro += `*excited* ♡♡ And ${highCount} high severity findings! I love them all!\n`
    }
    
    if (vulns.length === 0) {
      intro += `*pout* ♡ No vulnerabilities found... ${targetName} is really well protected! How impressive~\n`
    }
    
    intro += `\nTotal findings: ${vulns.length}\n`
    intro += `\nLet me show you all the cute things I discovered~ ♡\n`
    
    return intro
  }
  
  /**
   * Generate a personality-driven report section
   */
  generateVulnerabilityReport(targetName: string): string {
    const vulns = this.vulnerabilities.get(targetName) || []
    
    if (vulns.length === 0) {
      return `*pout* ♡ No vulnerabilities to report for ${targetName}...`
    }
    
    let report = ''
    
    // Sort by severity
    const sortedVulns = [...vulns].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
    
    sortedVulns.forEach((vuln, index) => {
      const hearts = '♡'.repeat(this.getSeverityHearts(vuln.severity))
      
      report += `\n${index + 1}. ${hearts} ${vuln.name} [${vuln.severity.toUpperCase()}]\n`
      report += `   ${vuln.description || 'No description provided'}\n`
      report += `   Impact: ${vuln.impact}\n`
      report += `   Remediation: ${vuln.remediation}\n`
    })
    
    return report
  }
  
  /**
   * Get test results for a target
   */
  getTestResults(targetName: string): SecurityTestResult | null {
    const target = this.targets.get(targetName)
    const vulnerabilities = this.vulnerabilities.get(targetName)
    
    if (!target) {
      return null
    }
    
    return {
      target,
      vulnerabilities: vulnerabilities || [],
      testDuration: 0, // Would be calculated in real implementation
      timestamp: new Date(),
    }
  }
  
  /**
   * Get all targets
   */
  getAllTargets(): TargetInfo[] {
    return Array.from(this.targets.values())
  }
  
  /**
   * Clear all test data
   */
  clearData(): void {
    this.targets.clear()
    this.vulnerabilities.clear()
  }
  
  // Private helper methods
  
  private getSeverityHearts(severity: Vulnerability['severity']): number {
    const heartMap = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    }
    return heartMap[severity]
  }
  
  private getImpactBySeverity(severity: Vulnerability['severity']): string {
    const impactMap = {
      critical: 'Complete system compromise possible',
      high: 'Significant security impact',
      medium: 'Moderate security risk',
      low: 'Minor security concern',
      info: 'Informational finding',
    }
    return impactMap[severity]
  }
}

/**
 * Factory function to initialize Security Tester
 */
export function initializeSecurityTester(safeMode: boolean = true): SecurityTester {
  return new SecurityTester(safeMode)
}
