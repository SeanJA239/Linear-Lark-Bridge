use clap::{Parser, Subcommand};

mod tasks;

#[derive(Parser)]
#[command(about = "Repository maintenance tasks")]
struct Cli {
    #[command(subcommand)]
    command: Task,
}

#[derive(Subcommand)]
enum Task {
    /// Refresh apps/integrations/linear/graphql/schema.graphql.
    UpdateLinearSchema,
    /// Refresh dashboard/openapi.json (the console API spec the frontend SDK
    /// is generated from).
    DumpOpenapi,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Task::UpdateLinearSchema => tasks::update_linear_schema(),
        Task::DumpOpenapi => tasks::dump_openapi(),
    }
}
