export interface VisaTypeData {
    id: string
    title: string
    description: string
    keywords: string[]
    faq: { question: string; answer: string }[]
}

export const visaTypes: VisaTypeData[] = [
    {
        id: 'f1-visa',
        title: 'F-1 Student Visa Interview Guide',
        description: 'Complete guide for F-1 Student Visa interviews. Practice confident answers for questions about your university, major, and funding.',
        keywords: ['f1 visa interview', 'student visa questions', 'study in usa', 'us visa mock test'],
        faq: [
            {
                question: 'What are common F-1 visa interview questions?',
                answer: 'Common questions include: Why did you choose this university? What is your major? Who is sponsoring your education? What are your plans after graduation?'
            },
            {
                question: 'How should I answer about my funding?',
                answer: 'Be honest and specific. Mention your sponsor, their relationship to you, and ensure you have financial documents to prove availability of funds.'
            }
        ]
    },
    {
        id: 'b1-b2-visa',
        title: 'B1/B2 Tourist & Business Visa Interview',
        description: 'Prepare for your B1/B2 Visitor Visa interview. Learn how to demonstrate ties to your home country and clear travel purpose.',
        keywords: ['b1 b2 visa', 'tourist visa interview', 'business visa usa', 'visitor visa questions'],
        faq: [
            {
                question: 'What is the most important factor for B1/B2 visa?',
                answer: 'Demonstrating strong ties to your home country (job, property, family) to prove you have no intent to immigrate.'
            },
            {
                question: 'Can I look for a job on a B1/B2 visa?',
                answer: 'No, looking for work or employment is strictly prohibited on a B1/B2 visitor visa.'
            }
        ]
    },
    {
        id: 'h1b-visa',
        title: 'H-1B Specialty Occupation Visa',
        description: 'Master your H-1B visa interview. Focus on your specialized skills, your employer, and your role details.',
        keywords: ['h1b visa interview', 'work visa usa', 'specialty occupation', 'h1b questions'],
        faq: [
            {
                question: 'What questions are asked in H-1B interview?',
                answer: 'Officers often ask about your job duties, salary, your employer/company, and your educational background relative to the job.'
            }
        ]
    }
]
