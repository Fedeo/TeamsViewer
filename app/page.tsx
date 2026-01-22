import { TopMenu } from '@/components/TopMenu';
import { Scheduler } from '@/features/scheduler';

export default function HomePage() {
  return (
    <main>
      <TopMenu />
      <Scheduler />
    </main>
  );
}
