import { useTracking } from '@/core/hooks/useTracking';

// Component để auto-track page views
const TrackingWrapper = () => {
    useTracking(); // Auto track page views on route change
    return null;
};

export default TrackingWrapper;
