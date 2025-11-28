import ResourceConsole from '../components/ResourceConsole';

function MachinePage() {
  return (
    <ResourceConsole
      resourceName="Machine"
      title="Machine"
      description="Interact with Machine endpoints (list, get by id, create, update, delete)."
    />
  );
}

export default MachinePage;
