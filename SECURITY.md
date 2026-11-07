# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues or
on social media.

If you believe you have found a vulnerability in Market Earth (Civic Ledger),
please use the repository's **Report a vulnerability** option under the
[Security tab](https://github.com/valorjesson-commits/marketearth/security),
if available. This creates a private report for the maintainers.

If private reporting is unavailable, contact the maintainer through
[GitHub](https://github.com/valorjesson-commits) or
[X](https://x.com/ValenVance5d) to arrange a private reporting channel.
Do not include vulnerability details in a public message.

Please include:

- A description of the issue and its potential impact
- Steps to reproduce, including any relevant configuration
- Affected components, such as the frontend, Motoko canister, or
  Internet Identity integration
- Suggested mitigations, if known

Please avoid accessing other users' data, disrupting services, or exploiting
an issue beyond what is necessary to demonstrate it.

## Scope

This policy covers project-controlled components, including:

- Market Earth / Civic Ledger application code, including Motoko backend
  canisters and the TypeScript frontend
- Application authentication and identity handling
- Me-Coin and We-Coin logic
- Deployment configuration and infrastructure under project control,
  including marketearth.io

Issues in upstream Internet Computer infrastructure, Motoko, Caffeine
tooling, or third-party dependencies should generally be reported to their
respective maintainers. If an upstream issue also affects Market Earth,
you may report its impact to us privately so we can assess mitigations.

Social engineering, physical attacks, and denial-of-service testing against
public infrastructure are outside the scope of this policy.

## Response and Disclosure

We aim to acknowledge reports within **7 days** and provide updates as
progress is made. As a single-maintainer project, response times may vary.

We will work with reporters on coordinated disclosure, aiming for disclosure
after a fix is available and typically within 90 days of confirmation.
Complex issues may require a different timeline agreed with the reporter.

## Security Practices

Market Earth is an early-stage, single-maintainer project. The primary GitHub
account uses two-factor authentication, and the application uses Internet
Identity for user authentication.

As the project matures, the maintainer plans to introduce automated CI checks
and expand contributor access controls as needed.

## Contact

- GitHub: [@valorjesson-commits](https://github.com/valorjesson-commits)
- X: [@ValenVance5d](https://x.com/ValenVance5d)

Thank you for helping keep Market Earth and its community secure.
