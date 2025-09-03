# Claude Code Instructions: Swiss Unihockey Tracker - React SPA Development Plan

## Project Context & Goals

### Primary Objective
Build a Swiss Unihockey live tracking web application as a React Single Page Application with modern routing and data management. The app should feel native and responsive while providing shareable URLs for all states and views.

### Technology Stack
- **React 19** with TypeScript for component architecture
- **TanStack Router** for file-based routing with URL state management
- **TanStack Query** for data fetching, caching, and synchronization
- **Tailwind CSS** for styling system
- **shadcn/ui** for component library
- **Vite** for build tooling and development

### Core Principles
- **URL-First Design**: Every app state should have a shareable URL
- **DRY (Don't Repeat Yourself)**: Reusable components with prop-based customization  
- **Smart Caching**: Intelligent data fetching with background updates
- **Mobile-First**: Responsive design optimized for mobile devices
- **Performance-Focused**: Code splitting and lazy loading where appropriate

### User Experience Goals
- Instant navigation between routes
- Shareable URLs for all views and filtered states
- Smart background data updates
- Offline-capable basic functionality
- Real-time feel for live content

## Implementation Priority and Notes

### Development Sequence
1. Set up routing and basic navigation structure
2. Implement data fetching with mock data
3. Build core components with URL integration
4. Create main pages with full functionality
5. Add real-time features and optimizations
6. Polish and performance optimization
7. Comprehensive testing and validation

### Technical Considerations
- URL design should be intuitive and SEO-friendly where relevant
- All interactive elements should update URL state appropriately
- Data caching should balance freshness with performance
- Mobile experience should be prioritized throughout development
- Error handling should be comprehensive and user-friendly

### Future Integration Notes
This React SPA architecture will integrate seamlessly with the planned PHP backend:
- TanStack Query will handle API integration naturally
- Real-time updates can be implemented via Server-Sent Events
- URL state management will work with server-side filtering
- Caching strategy will complement server-side optimization

The application should be built with future API integration in mind while providing excellent development experience with mock data.

## Implementation Notes

### Development Priority
1. Start with static components and mock data
2. Build core functionality before adding polish
3. Test mobile experience throughout development
4. Focus on reusable components over specific implementations
5. Validate design decisions with the provided screenshots

### Architecture Decisions
- Use Astro components for all static content
- Implement React Islands only for true interactivity (filtering, search)
- Leverage shadcn/ui for consistent design language
- Build with future API integration in mind
- Design for performance from the start

### Quality Standards
- All components must be fully responsive
- TypeScript types must be comprehensive
- Error handling should be robust and user-friendly
- Loading states should provide clear feedback
- Accessibility should be built in, not added later

### Future Considerations
The application is being built with future enhancements in mind:
- Real-time data integration via PHP backend
- Server-Sent Events for live updates
- User preference management
- Push notification system
- Progressive Web App features

Each phase should be completed and tested before moving to the next. The goal is to create a solid foundation that can be enhanced with real-time features while maintaining excellent performance and user experience.