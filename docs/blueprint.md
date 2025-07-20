# **App Name**: Hublancer

## Core Features:

- User Authentication: Users can register and login as either clients or taskers using Firebase Auth.
- Task Posting: Clients can post tasks with a title, description, budget, preferred date/time, and task type (physical or online).
- Task Browsing: Display tasks in a list with title, location, date, time, price, and number of offers, with physical tasks indicated on a map via Google Maps API.
- Task Bidding/Application: Enable taskers to bid on tasks and clients to accept offers. If offers/bids are not supported then taskers can just 'apply'.
- In-App Messaging: Enable messaging between clients and taskers to discuss task details via Firestore.
- Task Management: Tasks transition through statuses: Open -> Assigned -> Completed. Clients and taskers have a "My Tasks" page for task management and review.
- AI Description Assistant: Implement an AI-powered task description tool. It should review the client's task title and other given info, and then generate a helpful, detailed, and engaging description of the task.

## Style Guidelines:

- Primary color: A calm teal (#4DB6AC), suggesting efficiency and collaboration.
- Background color: Light gray (#ECEFF1) for a clean and modern backdrop.
- Accent color: Warm orange (#000000) for highlighting important actions like "Post a task".
- Body font: 'PT Sans' sans-serif font for a modern, clean look.
- Headline font: 'Space Grotesk', a bold, modern font, to create an innovative and fresh feeling
- Use modern and easily recognizable icons for task categories and navigation.
- Maintain a card-based layout with ample spacing and clear section dividers to focus attention.